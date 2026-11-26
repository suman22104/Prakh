import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { maskSensitiveData } from '../../../shared/masking';
import { runRuleBasedAnalysis } from '../../../shared/ruleEngine';
import type {
  ConsentOptions,
  InputType,
  LanguageCode,
  OfflineQueueItem,
  ProviderHealthStatus,
  ReviewCaseStatus,
  ScamAnalysisResult,
} from '../../../shared/types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { TranslationBundle } from '../i18n/translations';
import { useLanguage } from './LanguageContext';
import { analyzeMessageRequest, fetchHealthStatus } from '../services/api';
import { ADMIN_EMAIL, auth, googleProvider } from '../services/firebase';
import {
  clearAllLocalRecords,
  createReviewCaseInFirestore,
  deleteAllUserFirestoreData,
  fetchAuditLogsFromFirestore,
  fetchConsentedReviewCasesFromFirestore,
  fetchUserAnalysesFromFirestore,
  fetchUserConsentsFromFirestore,
  loadLocalAuditLogs,
  loadLocalConsentedHistory,
  loadLocalConsents,
  loadLocalReviewCases,
  loadOfflineQueue,
  persistAnalysisToFirestore,
  persistAuditLogToFirestore,
  persistConsentToFirestore,
  saveLocalAuditLog,
  saveLocalConsent,
  saveLocalConsentedAnalysis,
  saveLocalReviewCase,
  saveOfflineQueue,
  updateReviewCaseInFirestore,
  type StoredAuditLog,
  type StoredConsentRecord,
  type StoredReviewCase,
} from '../services/persistence';

interface AppContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationBundle;
  isOnline: boolean;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  history: ScamAnalysisResult[];
  consents: StoredConsentRecord[];
  offlineQueue: OfflineQueueItem[];
  reviewCases: StoredReviewCase[];
  auditLogs: StoredAuditLog[];
  health: ProviderHealthStatus | null;
  dataLoading: boolean;
  persistenceNotice: string | null;
  getResultById: (id: string) => ScamAnalysisResult | undefined;
  runScamCheck: (params: {
    message: string;
    inputType: InputType;
    language: LanguageCode;
    consent: ConsentOptions;
    actorRole?: 'citizen' | 'helper';
  }) => Promise<ScamAnalysisResult>;
  enqueueOfflineCheck: (params: {
    message: string;
    inputType: InputType;
    language: LanguageCode;
  }) => OfflineQueueItem;
  removeOfflineQueueItem: (id: string) => void;
  submitOfflineQueueItemWithConsent: (
    item: OfflineQueueItem,
    allowExternalAi: boolean
  ) => Promise<ScamAnalysisResult>;
  submitHumanReviewCase: (result: ScamAnalysisResult) => Promise<StoredReviewCase>;
  updateReviewCaseDecision: (
    caseId: string,
    status: ReviewCaseStatus,
    notes: string
  ) => Promise<void>;
  deleteAllHistory: () => Promise<void>;
  refreshHealth: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();

  const isOnline = useOnlineStatus();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [history, setHistory] = useState<ScamAnalysisResult[]>(() => loadLocalConsentedHistory());
  const [consents, setConsents] = useState<StoredConsentRecord[]>(() => loadLocalConsents());
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => loadOfflineQueue());
  const [reviewCases, setReviewCases] = useState<StoredReviewCase[]>(() => loadLocalReviewCases());
  const [auditLogs, setAuditLogs] = useState<StoredAuditLog[]>(() => loadLocalAuditLogs());
  const [health, setHealth] = useState<ProviderHealthStatus | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [persistenceNotice, setPersistenceNotice] = useState<string | null>(null);

  // Ephemeral in-memory map for unconsented (non-stored) results so users can view their verdict once without saving it
  const transientResultsRef = useRef<Map<string, ScamAnalysisResult>>(new Map());

  const isAdmin = Boolean(
    ADMIN_EMAIL &&
      user &&
      user.emailVerified &&
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const refreshHealth = useCallback(async () => {
    const h = await fetchHealthStatus();
    setHealth(h);
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Load Firestore data when authenticated
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setHistory(loadLocalConsentedHistory());
      setConsents(loadLocalConsents());
      setReviewCases(loadLocalReviewCases());
      setAuditLogs(loadLocalAuditLogs());
      return;
    }

    let cancelled = false;
    const syncFirestore = async () => {
      setDataLoading(true);
      setPersistenceNotice(null);
      try {
        const [remoteAnalyses, remoteConsents, remoteReviews, remoteLogs] = await Promise.all([
          fetchUserAnalysesFromFirestore(user.uid),
          fetchUserConsentsFromFirestore(user.uid),
          fetchConsentedReviewCasesFromFirestore(user.uid, isAdmin),
          fetchAuditLogsFromFirestore(user.uid, isAdmin),
        ]);
        if (!cancelled) {
          setHistory(remoteAnalyses);
          setConsents(remoteConsents);
          setReviewCases(remoteReviews);
          setAuditLogs(remoteLogs);
        }
      } catch (err) {
        console.error('Could not load synced records:', err);
        if (!cancelled) {
          setPersistenceNotice(
            'Could not sync remote database records right now; showing device-local records.'
          );
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    void syncFirestore();
    return () => {
      cancelled = true;
    };
  }, [authReady, user, isAdmin]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const getResultById = useCallback(
    (id: string): ScamAnalysisResult | undefined => {
      return transientResultsRef.current.get(id) ?? history.find((item) => item.id === id);
    },
    [history]
  );

  const runScamCheck = useCallback(
    async (params: {
      message: string;
      inputType: InputType;
      language: LanguageCode;
      consent: ConsentOptions;
      actorRole?: 'citizen' | 'helper';
    }): Promise<ScamAnalysisResult> => {
      const result = await analyzeMessageRequest(
        {
          message: params.message,
          inputType: params.inputType,
          language: params.language,
          consent: params.consent,
          actorRole: params.actorRole ?? 'citizen',
        },
        isOnline
      );

      // Keep in ephemeral memory so Result page always works even when storage consent is false
      transientResultsRef.current.set(result.id, result);

      const actorRole = params.actorRole ?? 'citizen';

      // Only store if user explicitly consented to storage
      if (params.consent.allowStorage) {
        if (user && user.emailVerified) {
          try {
            await persistAnalysisToFirestore(user.uid, result);
            const consentRec = await persistConsentToFirestore(
              user.uid,
              params.consent,
              params.inputType,
              params.language
            );
            const auditRec = await persistAuditLogToFirestore(user.uid, {
              eventType: 'SCAM_CHECK',
              actorRole,
              assessmentSource: result.assessmentSource,
              consentGranted: true,
              summary: `Checked ${params.inputType} (${params.language.toUpperCase()}) -> ${result.verdict}`,
            });

            setHistory((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
            setConsents((prev) => [consentRec, ...prev]);
            setAuditLogs((prev) => [auditRec, ...prev]);

            if (params.consent.allowHumanReview) {
              const rev = await createReviewCaseInFirestore(user.uid, result);
              setReviewCases((prev) => [rev, ...prev]);
            }
          } catch (err) {
            console.error('Firestore write failed, falling back to device-local consented store:', err);
            saveLocalConsentedAnalysis(result);
            setHistory((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
          }
        } else {
          // Device-local consented storage when not signed in
          saveLocalConsentedAnalysis(result);
          const localConsent: StoredConsentRecord = {
            id: `con_${Date.now().toString(36)}`,
            ownerId: 'local_device',
            consentExternalAi: params.consent.allowExternalAi,
            consentStorage: true,
            consentHumanReview: params.consent.allowHumanReview,
            policyVersion: params.consent.policyVersion,
            inputType: params.inputType,
            language: params.language,
            createdAt: new Date().toISOString(),
          };
          saveLocalConsent(localConsent);

          const localAudit: StoredAuditLog = {
            id: `aud_${Date.now().toString(36)}`,
            ownerId: 'local_device',
            eventType: 'SCAM_CHECK',
            actorRole,
            assessmentSource: result.assessmentSource,
            consentGranted: true,
            summary: `Checked ${params.inputType} (${params.language.toUpperCase()}) -> ${result.verdict}`,
            createdAt: new Date().toISOString(),
          };
          saveLocalAuditLog(localAudit);

          setHistory((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
          setConsents((prev) => [localConsent, ...prev]);
          setAuditLogs((prev) => [localAudit, ...prev]);

          if (params.consent.allowHumanReview) {
            const localReview: StoredReviewCase = {
              id: `rev_${Date.now().toString(36)}`,
              ownerId: 'local_device',
              analysisId: result.id,
              maskedExcerpt: result.maskedText.slice(0, 2500),
              inputType: result.inputType,
              language: result.language,
              verdict: result.verdict,
              riskScore: result.riskScore,
              confidence: result.confidence,
              consentHumanReview: true,
              status: 'PENDING',
              reviewerNotes: '',
              reviewedBy: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveLocalReviewCase(localReview);
            setReviewCases((prev) => [localReview, ...prev]);
          }
        }
      }

      return result;
    },
    [isOnline, user]
  );

  const enqueueOfflineCheck = useCallback(
    (params: { message: string; inputType: InputType; language: LanguageCode }): OfflineQueueItem => {
      const masking = maskSensitiveData(params.message.trim());
      const localPreview = runRuleBasedAnalysis({
        message: params.message.trim(),
        inputType: params.inputType,
        language: params.language,
        consent: {
          allowExternalAi: false,
          allowStorage: false,
          allowHumanReview: false,
          policyVersion: 'v1.0',
        },
        assessmentSource: 'offline_rules',
      });

      const item: OfflineQueueItem = {
        id: `off_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        maskedText: masking.maskedText.slice(0, 2500),
        inputType: params.inputType,
        language: params.language,
        localPreviewVerdict: localPreview.verdict,
        localPreviewScore: localPreview.riskScore,
        redactions: masking.redactions,
        createdAt: new Date().toISOString(),
      };

      setOfflineQueue((prev) => {
        const next = [item, ...prev];
        saveOfflineQueue(next);
        return next;
      });

      return item;
    },
    []
  );

  const removeOfflineQueueItem = useCallback((id: string) => {
    setOfflineQueue((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveOfflineQueue(next);
      return next;
    });
  }, []);

  const submitOfflineQueueItemWithConsent = useCallback(
    async (item: OfflineQueueItem, allowExternalAi: boolean): Promise<ScamAnalysisResult> => {
      const result = await runScamCheck({
        message: item.maskedText,
        inputType: item.inputType,
        language: item.language,
        consent: {
          allowExternalAi,
          allowStorage: true,
          allowHumanReview: false,
          policyVersion: 'v1.0',
        },
        actorRole: 'citizen',
      });
      removeOfflineQueueItem(item.id);
      return result;
    },
    [removeOfflineQueueItem, runScamCheck]
  );

  const submitHumanReviewCase = useCallback(
    async (result: ScamAnalysisResult): Promise<StoredReviewCase> => {
      if (user && user.emailVerified) {
        const rev = await createReviewCaseInFirestore(user.uid, result);
        const aud = await persistAuditLogToFirestore(user.uid, {
          eventType: 'REVIEW_SUBMITTED',
          actorRole: 'citizen',
          assessmentSource: result.assessmentSource,
          consentGranted: true,
          summary: `Consented human review requested for ${result.verdict} (${result.inputType})`,
        });
        setReviewCases((prev) => [rev, ...prev]);
        setAuditLogs((prev) => [aud, ...prev]);
        return rev;
      }

      const localRev: StoredReviewCase = {
        id: `rev_${Date.now().toString(36)}`,
        ownerId: 'local_device',
        analysisId: result.id,
        maskedExcerpt: result.maskedText.slice(0, 2500),
        inputType: result.inputType,
        language: result.language,
        verdict: result.verdict,
        riskScore: result.riskScore,
        confidence: result.confidence,
        consentHumanReview: true,
        status: 'PENDING',
        reviewerNotes: '',
        reviewedBy: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveLocalReviewCase(localRev);
      const localAud: StoredAuditLog = {
        id: `aud_${Date.now().toString(36)}`,
        ownerId: 'local_device',
        eventType: 'REVIEW_SUBMITTED',
        actorRole: 'citizen',
        assessmentSource: result.assessmentSource,
        consentGranted: true,
        summary: `Consented human review requested locally for ${result.verdict}`,
        createdAt: new Date().toISOString(),
      };
      saveLocalAuditLog(localAud);
      setReviewCases((prev) => [localRev, ...prev]);
      setAuditLogs((prev) => [localAud, ...prev]);
      return localRev;
    },
    [user]
  );

  const updateReviewCaseDecision = useCallback(
    async (caseId: string, status: ReviewCaseStatus, notes: string) => {
      if (!user || !isAdmin) {
        throw new Error('Authorized reviewer sign-in is required to update review cases.');
      }
      const reviewerLabel = user.email || user.uid;
      await updateReviewCaseInFirestore(caseId, status, notes, reviewerLabel);
      const aud = await persistAuditLogToFirestore(user.uid, {
        eventType: 'REVIEW_UPDATED',
        actorRole: 'reviewer',
        assessmentSource: 'system',
        consentGranted: true,
        summary: `Reviewer updated case ${caseId.slice(0, 12)} to ${status}`,
      });
      setReviewCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                status,
                reviewerNotes: notes,
                reviewedBy: reviewerLabel,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
      setAuditLogs((prev) => [aud, ...prev]);
    },
    [isAdmin, user]
  );

  const deleteAllHistory = useCallback(async () => {
    if (user && user.emailVerified) {
      await deleteAllUserFirestoreData(user.uid);
    }
    clearAllLocalRecords();
    transientResultsRef.current.clear();
    setHistory([]);
    setConsents([]);
    setOfflineQueue([]);
    setReviewCases([]);
    setAuditLogs([]);
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isOnline,
        user,
        authReady,
        isAdmin,
        signInWithGoogle,
        signOutUser,
        history,
        consents,
        offlineQueue,
        reviewCases,
        auditLogs,
        health,
        dataLoading,
        persistenceNotice,
        getResultById,
        runScamCheck,
        enqueueOfflineCheck,
        removeOfflineQueueItem,
        submitOfflineQueueItemWithConsent,
        submitHumanReviewCase,
        updateReviewCaseDecision,
        deleteAllHistory,
        refreshHealth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
