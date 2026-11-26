import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import type {
  AssessmentSource,
  AuditEventType,
  ConsentOptions,
  InputType,
  LanguageCode,
  OfflineQueueItem,
  ReviewCaseStatus,
  ScamAnalysisResult,
  Verdict,
} from '../../../shared/types';
import { db, handleFirestoreError, OperationType } from './firebase';

const LOCAL_HISTORY_KEY = 'upi_guard_consented_history_v1';
const LOCAL_CONSENTS_KEY = 'upi_guard_consents_v1';
const LOCAL_OFFLINE_QUEUE_KEY = 'upi_guard_offline_queue_v1';
const LOCAL_AUDIT_KEY = 'upi_guard_audit_v1';
const LOCAL_REVIEWS_KEY = 'upi_guard_review_cases_v1';

export interface StoredConsentRecord {
  id: string;
  ownerId: string;
  consentExternalAi: boolean;
  consentStorage: boolean;
  consentHumanReview: boolean;
  policyVersion: string;
  inputType: InputType;
  language: LanguageCode;
  createdAt: string;
}

export interface StoredReviewCase {
  id: string;
  ownerId: string;
  analysisId: string;
  maskedExcerpt: string;
  inputType: InputType;
  language: LanguageCode;
  verdict: Verdict;
  riskScore: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  consentHumanReview: boolean;
  status: ReviewCaseStatus;
  reviewerNotes: string;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAuditLog {
  id: string;
  ownerId: string;
  eventType: AuditEventType;
  actorRole: 'citizen' | 'helper' | 'reviewer';
  assessmentSource: AssessmentSource | 'system';
  consentGranted: boolean;
  summary: string;
  createdAt: string;
}

function safeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64);
}

function timestampToIso(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && 'toDate' in val) {
    return (val as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

function readLocalJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalJson<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, 100)));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

// --- Offline Queue (Device-only, strictly masked, manual renewed consent required) ---

export function loadOfflineQueue(): OfflineQueueItem[] {
  return readLocalJson<OfflineQueueItem>(LOCAL_OFFLINE_QUEUE_KEY);
}

export function saveOfflineQueue(items: OfflineQueueItem[]): void {
  writeLocalJson(LOCAL_OFFLINE_QUEUE_KEY, items);
}

// --- Local Fallback Consented Storage (when not signed in to Google) ---

export function loadLocalConsentedHistory(): ScamAnalysisResult[] {
  return readLocalJson<ScamAnalysisResult>(LOCAL_HISTORY_KEY);
}

export function saveLocalConsentedAnalysis(result: ScamAnalysisResult): void {
  if (!result.consentSnapshot.allowStorage) return;
  const existing = loadLocalConsentedHistory().filter((r) => r.id !== result.id);
  writeLocalJson(LOCAL_HISTORY_KEY, [result, ...existing]);
}

export function loadLocalConsents(): StoredConsentRecord[] {
  return readLocalJson<StoredConsentRecord>(LOCAL_CONSENTS_KEY);
}

export function saveLocalConsent(record: StoredConsentRecord): void {
  const existing = loadLocalConsents().filter((r) => r.id !== record.id);
  writeLocalJson(LOCAL_CONSENTS_KEY, [record, ...existing]);
}

export function loadLocalAuditLogs(): StoredAuditLog[] {
  return readLocalJson<StoredAuditLog>(LOCAL_AUDIT_KEY);
}

export function saveLocalAuditLog(log: StoredAuditLog): void {
  const existing = loadLocalAuditLogs().filter((l) => l.id !== log.id);
  writeLocalJson(LOCAL_AUDIT_KEY, [log, ...existing]);
}

export function loadLocalReviewCases(): StoredReviewCase[] {
  return readLocalJson<StoredReviewCase>(LOCAL_REVIEWS_KEY);
}

export function saveLocalReviewCase(reviewCase: StoredReviewCase): void {
  if (!reviewCase.consentHumanReview) return;
  const existing = loadLocalReviewCases().filter((c) => c.id !== reviewCase.id);
  writeLocalJson(LOCAL_REVIEWS_KEY, [reviewCase, ...existing]);
}

export function clearAllLocalRecords(): void {
  localStorage.removeItem(LOCAL_HISTORY_KEY);
  localStorage.removeItem(LOCAL_CONSENTS_KEY);
  localStorage.removeItem(LOCAL_AUDIT_KEY);
  localStorage.removeItem(LOCAL_REVIEWS_KEY);
  localStorage.removeItem(LOCAL_OFFLINE_QUEUE_KEY);
}

// --- Firestore Persisted Operations (Authenticated verified users) ---

export async function persistAnalysisToFirestore(
  uid: string,
  result: ScamAnalysisResult
): Promise<void> {
  if (!result.consentSnapshot.allowStorage) return;
  const docId = result.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || safeId('chk');
  const path = `analyses/${docId}`;
  try {
    await setDoc(doc(db, 'analyses', docId), {
      ownerId: uid,
      inputType: result.inputType,
      language: result.language,
      maskedText: result.maskedText.slice(0, 2500),
      verdict: result.verdict,
      riskScore: Math.max(0, Math.min(100, Math.round(result.riskScore))),
      confidence: result.confidence,
      assessmentSource: result.assessmentSource,
      warningSigns: result.warningSigns.slice(0, 12).map((s) => s.slice(0, 200)),
      explanation: result.explanation.slice(0, 1200),
      recommendedActions: result.recommendedActions.slice(0, 10).map((s) => s.slice(0, 240)),
      humanReviewRecommended: Boolean(result.humanReviewRecommended),
      consentStorage: true,
      consentExternalAi: Boolean(result.consentSnapshot.allowExternalAi),
      consentHumanReview: Boolean(result.consentSnapshot.allowHumanReview),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function persistConsentToFirestore(
  uid: string,
  consent: ConsentOptions,
  inputType: InputType,
  language: LanguageCode
): Promise<StoredConsentRecord> {
  const id = safeId('con');
  const path = `consents/${id}`;
  try {
    await setDoc(doc(db, 'consents', id), {
      ownerId: uid,
      consentExternalAi: Boolean(consent.allowExternalAi),
      consentStorage: Boolean(consent.allowStorage),
      consentHumanReview: Boolean(consent.allowHumanReview),
      policyVersion: (consent.policyVersion || 'v1.0').slice(0, 32),
      inputType,
      language,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id,
    ownerId: uid,
    consentExternalAi: consent.allowExternalAi,
    consentStorage: consent.allowStorage,
    consentHumanReview: consent.allowHumanReview,
    policyVersion: consent.policyVersion || 'v1.0',
    inputType,
    language,
    createdAt: new Date().toISOString(),
  };
}

export async function persistAuditLogToFirestore(
  uid: string,
  params: {
    eventType: AuditEventType;
    actorRole: 'citizen' | 'helper' | 'reviewer';
    assessmentSource: AssessmentSource | 'system';
    consentGranted: boolean;
    summary: string;
  }
): Promise<StoredAuditLog> {
  const id = safeId('aud');
  const path = `auditLogs/${id}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      ownerId: uid,
      eventType: params.eventType,
      actorRole: params.actorRole,
      assessmentSource: params.assessmentSource,
      consentGranted: Boolean(params.consentGranted),
      summary: params.summary.slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id,
    ownerId: uid,
    ...params,
    createdAt: new Date().toISOString(),
  };
}

export async function createReviewCaseInFirestore(
  uid: string,
  result: ScamAnalysisResult
): Promise<StoredReviewCase> {
  const id = safeId('rev');
  const analysisId = result.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || safeId('chk');
  const path = `reviewCases/${id}`;
  try {
    await setDoc(doc(db, 'reviewCases', id), {
      ownerId: uid,
      analysisId,
      maskedExcerpt: result.maskedText.slice(0, 2500),
      inputType: result.inputType,
      language: result.language,
      verdict: result.verdict,
      riskScore: Math.max(0, Math.min(100, Math.round(result.riskScore))),
      confidence: result.confidence,
      consentHumanReview: true,
      status: 'PENDING',
      reviewerNotes: '',
      reviewedBy: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const now = new Date().toISOString();
  return {
    id,
    ownerId: uid,
    analysisId,
    maskedExcerpt: result.maskedText.slice(0, 2500),
    inputType: result.inputType,
    language: result.language,
    verdict: result.verdict,
    riskScore: Math.round(result.riskScore),
    confidence: result.confidence,
    consentHumanReview: true,
    status: 'PENDING',
    reviewerNotes: '',
    reviewedBy: '',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateReviewCaseInFirestore(
  caseId: string,
  status: ReviewCaseStatus,
  reviewerNotes: string,
  reviewedBy: string
): Promise<void> {
  const path = `reviewCases/${caseId}`;
  try {
    await updateDoc(doc(db, 'reviewCases', caseId), {
      status,
      reviewerNotes: reviewerNotes.slice(0, 2000),
      reviewedBy: reviewedBy.slice(0, 160),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchUserAnalysesFromFirestore(uid: string): Promise<ScamAnalysisResult[]> {
  const path = 'analyses';
  try {
    const q = query(
      collection(db, path),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        verdict: data.verdict as Verdict,
        riskScore: Number(data.riskScore ?? 0),
        confidence: data.confidence as 'LOW' | 'MEDIUM' | 'HIGH',
        warningSigns: Array.isArray(data.warningSigns) ? (data.warningSigns as string[]) : [],
        explanation: String(data.explanation ?? ''),
        recommendedActions: Array.isArray(data.recommendedActions)
          ? (data.recommendedActions as string[])
          : [],
        humanReviewRecommended: Boolean(data.humanReviewRecommended),
        assessmentSource: data.assessmentSource as AssessmentSource,
        maskedText: String(data.maskedText ?? ''),
        redactions: [],
        inputType: data.inputType as InputType,
        language: data.language as LanguageCode,
        urlAnalysis: { urlsFound: 0, findings: [], totalUrlRiskPoints: 0 },
        consentSnapshot: {
          allowExternalAi: Boolean(data.consentExternalAi),
          allowStorage: Boolean(data.consentStorage),
          allowHumanReview: Boolean(data.consentHumanReview),
          policyVersion: 'v1.0',
        },
        advisoryDisclaimer:
          'Advisory Notice: Automated checks cannot guarantee that a message is safe or fraudulent.',
        createdAt: timestampToIso(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchUserConsentsFromFirestore(uid: string): Promise<StoredConsentRecord[]> {
  const path = 'consents';
  try {
    const q = query(
      collection(db, path),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerId: String(data.ownerId ?? uid),
        consentExternalAi: Boolean(data.consentExternalAi),
        consentStorage: Boolean(data.consentStorage),
        consentHumanReview: Boolean(data.consentHumanReview),
        policyVersion: String(data.policyVersion ?? 'v1.0'),
        inputType: data.inputType as InputType,
        language: data.language as LanguageCode,
        createdAt: timestampToIso(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchConsentedReviewCasesFromFirestore(
  uid: string,
  isAdmin: boolean
): Promise<StoredReviewCase[]> {
  const path = 'reviewCases';
  try {
    const q = isAdmin
      ? query(
          collection(db, path),
          where('consentHumanReview', '==', true),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, path),
          where('ownerId', '==', uid),
          orderBy('createdAt', 'desc')
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerId: String(data.ownerId ?? ''),
        analysisId: String(data.analysisId ?? ''),
        maskedExcerpt: String(data.maskedExcerpt ?? ''),
        inputType: data.inputType as InputType,
        language: data.language as LanguageCode,
        verdict: data.verdict as Verdict,
        riskScore: Number(data.riskScore ?? 0),
        confidence: data.confidence as 'LOW' | 'MEDIUM' | 'HIGH',
        consentHumanReview: Boolean(data.consentHumanReview),
        status: data.status as ReviewCaseStatus,
        reviewerNotes: String(data.reviewerNotes ?? ''),
        reviewedBy: String(data.reviewedBy ?? ''),
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAuditLogsFromFirestore(
  uid: string,
  isAdmin: boolean
): Promise<StoredAuditLog[]> {
  const path = 'auditLogs';
  try {
    const q = isAdmin
      ? query(collection(db, path), orderBy('createdAt', 'desc'))
      : query(
          collection(db, path),
          where('ownerId', '==', uid),
          orderBy('createdAt', 'desc')
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerId: String(data.ownerId ?? ''),
        eventType: data.eventType as AuditEventType,
        actorRole: data.actorRole as 'citizen' | 'helper' | 'reviewer',
        assessmentSource: data.assessmentSource as AssessmentSource | 'system',
        consentGranted: Boolean(data.consentGranted),
        summary: String(data.summary ?? ''),
        createdAt: timestampToIso(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteAllUserFirestoreData(uid: string): Promise<void> {
  const collectionsToClear = ['analyses', 'consents', 'reviewCases', 'auditLogs'] as const;
  for (const colName of collectionsToClear) {
    try {
      const q = query(collection(db, colName), where('ownerId', '==', uid));
      const snap = await getDocs(q);
      for (const item of snap.docs) {
        await deleteDoc(doc(db, colName, item.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, colName);
    }
  }
}
