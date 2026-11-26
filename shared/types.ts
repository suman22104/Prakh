export type LanguageCode = 'en' | 'hi' | 'bn';

export type InputType = 'sms' | 'whatsapp' | 'url' | 'upi_request';

export type Verdict = 'SAFE' | 'SUSPICIOUS' | 'SCAM' | 'UNCERTAIN';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AssessmentSource = 'hybrid_ai' | 'rule_based_fallback' | 'offline_rules';

export type ReviewCaseStatus = 'PENDING' | 'REVIEWED' | 'ESCALATED' | 'CLOSED';

export type AuditEventType =
  | 'SCAM_CHECK'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'HISTORY_DELETED'
  | 'REVIEW_SUBMITTED'
  | 'REVIEW_UPDATED'
  | 'OFFLINE_QUEUE_SUBMITTED';

export interface RedactionSummary {
  type: 'phone' | 'upi_id' | 'account' | 'aadhaar' | 'pan' | 'otp' | 'card' | 'email';
  count: number;
}

export interface MaskingResult {
  maskedText: string;
  redactions: RedactionSummary[];
  totalRedacted: number;
}

export interface UrlFinding {
  rawUrl: string;
  displayUrl: string;
  hostname: string;
  riskPoints: number;
  flags: string[];
  isOfficialAllowlisted: boolean;
}

export interface UrlAnalysisSummary {
  urlsFound: number;
  findings: UrlFinding[];
  totalUrlRiskPoints: number;
}

export type InteropFindingKind = 'upi_handle' | 'ifsc_code';

export type InteropRecognitionStatus = 'recognized' | 'unrecognized';

export interface InteropFinding {
  kind: InteropFindingKind;
  identifier: string;
  status: InteropRecognitionStatus;
  bankName?: string;
  riskPoints: number;
  summaryLabel: string;
}

export interface InteropCheckSummary {
  identifiersFound: number;
  findings: InteropFinding[];
  totalInteropRiskPoints: number;
  overallLabel: string;
  hasUnrecognizedHandle: boolean;
}

export interface ConsentOptions {
  allowExternalAi: boolean;
  allowStorage: boolean;
  allowHumanReview: boolean;
  policyVersion: string;
}

export interface ScamAnalysisResult {
  id: string;
  verdict: Verdict;
  riskScore: number;
  confidence: ConfidenceLevel;
  warningSigns: string[];
  explanation: string;
  recommendedActions: string[];
  humanReviewRecommended: boolean;
  assessmentSource: AssessmentSource;
  aiProviderUsed?: string;
  fallbackReason?: string;
  maskedText: string;
  redactions: RedactionSummary[];
  inputType: InputType;
  language: LanguageCode;
  urlAnalysis: UrlAnalysisSummary;
  interopAnalysis?: InteropCheckSummary;
  consentSnapshot: ConsentOptions;
  advisoryDisclaimer: string;
  createdAt: string;
}

export interface AnalyzeRequestPayload {
  message: string;
  inputType: InputType;
  language: LanguageCode;
  consent: ConsentOptions;
  actorRole?: 'citizen' | 'helper';
}

export interface OfflineQueueItem {
  id: string;
  maskedText: string;
  inputType: InputType;
  language: LanguageCode;
  localPreviewVerdict: Verdict;
  localPreviewScore: number;
  createdAt: string;
  redactions: RedactionSummary[];
}

export interface SyntheticTestCase {
  id: string;
  number: number;
  title: string;
  category: string;
  inputType: InputType;
  language: LanguageCode;
  sampleMessage: string;
  expectedVerdicts: Verdict[];
  notes: string;
}

export interface ProviderHealthStatus {
  status: 'ok' | 'degraded';
  activeProvider: string;
  aiConfigured: boolean;
  ruleEngineReady: boolean;
  firestoreEnabled: boolean;
  mysqlSchemaAvailable: boolean;
  timestamp: string;
}
