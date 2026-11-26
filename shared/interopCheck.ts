import type { InteropCheckSummary, InteropFinding, LanguageCode } from './types';

/**
 * Synthetic offline directory of known NPCI / UPI participating PSP handles.
 * Zero external network calls — designed for low-bandwidth / offline hackathon & pilot validation.
 */
export const KNOWN_UPI_BANK_HANDLES: Record<string, string> = {
  okhdfcbank: 'HDFC Bank (Google Pay PSP)',
  okicici: 'ICICI Bank (Google Pay PSP)',
  oksbi: 'State Bank of India (Google Pay PSP)',
  okaxis: 'Axis Bank (Google Pay PSP)',
  ybl: 'Yes Bank (PhonePe PSP)',
  ibl: 'ICICI Bank (PhonePe PSP)',
  axl: 'Axis Bank (PhonePe PSP)',
  paytm: 'Paytm Partner Bank PSP',
  ptyes: 'Yes Bank (Paytm PSP)',
  pthdfc: 'HDFC Bank (Paytm PSP)',
  ptsbi: 'State Bank of India (Paytm PSP)',
  ptaxis: 'Axis Bank (Paytm PSP)',
  sbi: 'State Bank of India',
  upi: 'NPCI BHIM UPI',
  icici: 'ICICI Bank',
  hdfcbank: 'HDFC Bank',
  axisbank: 'Axis Bank',
  kotak: 'Kotak Mahindra Bank',
  pnb: 'Punjab National Bank',
  barodampay: 'Bank of Baroda',
  cnrb: 'Canara Bank',
  uboi: 'Union Bank of India',
  apl: 'Axis Bank (Amazon Pay PSP)',
  yapl: 'Yes Bank (Amazon Pay PSP)',
  rapl: 'RBL Bank (Amazon Pay PSP)',
  airtel: 'Airtel Payments Bank',
  jio: 'Jio Payments Bank',
  postbank: 'India Post Payments Bank',
  federal: 'Federal Bank',
  indus: 'IndusInd Bank',
  idbi: 'IDBI Bank',
  ucobank: 'UCO Bank',
  bandhan: 'Bandhan Bank',
};

/**
 * Synthetic offline directory of known Indian 4-letter IFSC bank prefixes.
 */
export const KNOWN_IFSC_BANK_CODES: Record<string, string> = {
  SBIN: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  UBIN: 'Union Bank of India',
  KKBK: 'Kotak Mahindra Bank',
  YESB: 'Yes Bank',
  UCBA: 'UCO Bank',
  BDBL: 'Bandhan Bank',
  IOBA: 'Indian Overseas Bank',
  IDIB: 'Indian Bank',
  BKID: 'Bank of India',
  CBIN: 'Central Bank of India',
  FDRL: 'Federal Bank',
  INDB: 'IndusInd Bank',
  IPOS: 'India Post Payments Bank',
  AIRP: 'Airtel Payments Bank',
  PYTM: 'Paytm Payments Bank',
};

const EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'rediffmail.com',
]);

function buildFindingLabel(
  kind: 'upi_handle' | 'ifsc_code',
  status: 'recognized' | 'unrecognized',
  identifier: string,
  bankName: string | undefined,
  language: LanguageCode
): string {
  if (kind === 'upi_handle') {
    if (status === 'recognized') {
      const map: Record<LanguageCode, string> = {
        en: `Recipient bank handle: recognized (${identifier} — ${bankName})`,
        hi: `प्राप्तकर्ता बैंक हैंडल: मान्यता प्राप्त (${identifier} — ${bankName})`,
        bn: `প্রাপকের ব্যাংক হ্যান্ডেল: পরিচিত (${identifier} — ${bankName})`,
      };
      return map[language];
    }
    const map: Record<LanguageCode, string> = {
      en: `Recipient bank handle: not recognized (${identifier} is not in participating UPI banks)`,
      hi: `प्राप्तकर्ता बैंक हैंडल: अमान्य / अपरिचित (${identifier} ज्ञात UPI बैंकों की सूची में नहीं है)`,
      bn: `প্রাপকের ব্যাংক হ্যান্ডেল: অপরিচিত (${identifier} পরিচিত UPI ব্যাংকের তালিকায় নেই)`,
    };
    return map[language];
  }

  if (status === 'recognized') {
    const map: Record<LanguageCode, string> = {
      en: `IFSC bank code: recognized (${identifier} — ${bankName})`,
      hi: `IFSC बैंक कोड: मान्यता प्राप्त (${identifier} — ${bankName})`,
      bn: `IFSC ব্যাংক কোড: পরিচিত (${identifier} — ${bankName})`,
    };
    return map[language];
  }
  const map: Record<LanguageCode, string> = {
    en: `IFSC bank code: not recognized (${identifier} is not in participating Indian banks)`,
    hi: `IFSC बैंक कोड: अमान्य / अपरिचित (${identifier} ज्ञात भारतीय बैंकों की सूची में नहीं है)`,
    bn: `IFSC ব্যাংক কোড: অপরিচিত (${identifier} পরিচিত ভারতীয় ব্যাংকের তালিকায় নেই)`,
  };
  return map[language];
}

function buildOverallLabel(findings: InteropFinding[], language: LanguageCode): string {
  if (findings.length === 0) {
    const noneMap: Record<LanguageCode, string> = {
      en: 'Recipient bank handle: none detected in message',
      hi: 'प्राप्तकर्ता बैंक हैंडल: संदेश में कोई UPI हैंडल या IFSC नहीं मिला',
      bn: 'প্রাপকের ব্যাংক হ্যান্ডেল: বার্তায় কোনো UPI হ্যান্ডেল বা IFSC পাওয়া যায়নি',
    };
    return noneMap[language];
  }

  const unrecognized = findings.filter((f) => f.status === 'unrecognized');
  if (unrecognized.length > 0) {
    const list = unrecognized.map((f) => f.identifier).join(', ');
    const unrecMap: Record<LanguageCode, string> = {
      en: `Recipient bank handle: not recognized (${list})`,
      hi: `प्राप्तकर्ता बैंक हैंडल: अपरिचित (${list})`,
      bn: `প্রাপকের ব্যাংক হ্যান্ডেল: অপরিচিত (${list})`,
    };
    return unrecMap[language];
  }

  const first = findings[0];
  const banks = Array.from(new Set(findings.map((f) => f.bankName).filter(Boolean))).join(', ');
  const recMap: Record<LanguageCode, string> = {
    en: `Recipient bank handle: recognized (${banks || first.identifier})`,
    hi: `प्राप्तकर्ता बैंक हैंडल: मान्यता प्राप्त (${banks || first.identifier})`,
    bn: `প্রাপকের ব্যাংক হ্যান্ডেল: পরিচিত (${banks || first.identifier})`,
  };
  return recMap[language];
}

/**
 * Pure deterministic interoperability checker for UPI VPA bank handles and Indian IFSC codes.
 * Validates against the synthetic offline directory of participating Indian banks without making
 * any external network calls, and never returns personal local-parts or raw branch details.
 */
export function analyzeInteropIdentifiers(
  text: string,
  language: LanguageCode = 'en'
): InteropCheckSummary {
  if (!text || typeof text !== 'string') {
    return {
      identifiersFound: 0,
      findings: [],
      totalInteropRiskPoints: 0,
      overallLabel: buildOverallLabel([], language),
      hasUnrecognizedHandle: false,
    };
  }

  const findings: InteropFinding[] = [];
  const seenKeys = new Set<string>();

  const registerUpiHandle = (rawHandle: string) => {
    const handle = rawHandle.toLowerCase().replace(/[^a-z0-9.-]/g, '');
    if (!handle || handle.length < 2) return;
    if (EMAIL_DOMAINS.has(handle) || /\.[a-z]{2,}$/i.test(handle)) return;
    const dedupeKey = `upi:${handle}`;
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);

    const bankName = KNOWN_UPI_BANK_HANDLES[handle];
    const identifier = `@${handle}`;
    const status = bankName ? 'recognized' : 'unrecognized';
    const riskPoints = bankName ? 0 : 18;

    findings.push({
      kind: 'upi_handle',
      identifier,
      status,
      bankName,
      riskPoints,
      summaryLabel: buildFindingLabel('upi_handle', status, identifier, bankName, language),
    });
  };

  // 1. Inspect upi://pay?pa=user@handle deep links first
  const upiPaRegex = /\bpa=([a-zA-Z0-9._-]{2,})@([a-zA-Z0-9.-]{2,})/gi;
  for (const match of text.matchAll(upiPaRegex)) {
    if (match[2]) registerUpiHandle(match[2]);
  }

  // 2. Inspect inline UPI VPAs (skipping email addresses with TLDs)
  const vpaRegex = /\b([a-zA-Z0-9._-]{2,})@([a-zA-Z0-9.-]{2,})\b/g;
  for (const match of text.matchAll(vpaRegex)) {
    if (match[2]) registerUpiHandle(match[2]);
  }

  // 3. Inspect Indian 11-character IFSC codes (4 uppercase letters + '0' + 6 alphanumeric with >=1 digit)
  const ifscRegex = /\b([A-Z]{4})0([A-Z0-9]{6})\b/g;
  for (const match of text.matchAll(ifscRegex)) {
    const bankPrefix = match[1];
    const branchPart = match[2];
    if (!/\d/.test(branchPart)) continue;
    const dedupeKey = `ifsc:${bankPrefix}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    const bankName = KNOWN_IFSC_BANK_CODES[bankPrefix];
    const maskedIfsc = `${bankPrefix}0******`;
    const status = bankName ? 'recognized' : 'unrecognized';
    const riskPoints = bankName ? 0 : 14;

    findings.push({
      kind: 'ifsc_code',
      identifier: maskedIfsc,
      status,
      bankName,
      riskPoints,
      summaryLabel: buildFindingLabel('ifsc_code', status, maskedIfsc, bankName, language),
    });
  }

  const totalInteropRiskPoints = Math.min(
    28,
    findings.reduce((sum, item) => sum + item.riskPoints, 0)
  );
  const hasUnrecognizedHandle = findings.some((f) => f.status === 'unrecognized');

  return {
    identifiersFound: findings.length,
    findings,
    totalInteropRiskPoints,
    overallLabel: buildOverallLabel(findings, language),
    hasUnrecognizedHandle,
  };
}
