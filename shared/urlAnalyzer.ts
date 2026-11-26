import type { UrlAnalysisSummary, UrlFinding } from './types';

const OFFICIAL_BANK_AND_GOV_DOMAINS = new Set([
  'sbi.co.in',
  'onlinesbi.sbi',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'pnbindia.in',
  'bankofbaroda.in',
  'canarabank.com',
  'unionbankofindia.co.in',
  'npci.org.in',
  'rbi.org.in',
  'uidai.gov.in',
  'cybercrime.gov.in',
  'incometax.gov.in',
  'epfindia.gov.in',
  'irctc.co.in',
  'paytm.com',
  'phonepe.com',
  'pay.google.com',
  'bhimupi.org.in',
]);

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'rb.gy',
  'cutt.ly',
  'is.gd',
  'shorturl.at',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'tiny.cc',
  'rebrand.ly',
  's.id',
]);

const RISKY_TLDS = [
  '.xyz',
  '.top',
  '.click',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.buzz',
  '.loan',
  '.win',
  '.icu',
  '.vip',
  '.online',
  '.site',
  '.live',
  '.club',
  '.work',
  '.link',
];

const IMPERSONATED_BRAND_TOKENS = [
  'sbi',
  'hdfc',
  'icici',
  'axis',
  'kotak',
  'pnb',
  'bob',
  'paytm',
  'phonepe',
  'gpay',
  'googlepay',
  'bhim',
  'upi',
  'npci',
  'rbi',
  'kyc',
  'uidai',
  'aadhaar',
  'aadhar',
  'pan',
  'incometax',
  'epfo',
  'irctc',
  'cashback',
  'reward',
  'verify',
  'update-bank',
];

function isDomainAllowlisted(hostname: string): boolean {
  const clean = hostname.toLowerCase().replace(/^www\./, '');
  if (OFFICIAL_BANK_AND_GOV_DOMAINS.has(clean)) return true;
  for (const official of OFFICIAL_BANK_AND_GOV_DOMAINS) {
    if (clean.endsWith(`.${official}`)) return true;
  }
  return false;
}

/**
 * Static lexical URL analysis ONLY.
 * Never opens, resolves, fetches, or follows untrusted links.
 */
export function analyzeUrlsInText(text: string): UrlAnalysisSummary {
  if (!text) {
    return { urlsFound: 0, findings: [], totalUrlRiskPoints: 0 };
  }

  const urlRegex =
    /(?:upi:\/\/pay\?[^\s]+|https?:\/\/[^\s"'<>]+|\b(?:www\.|[a-zA-Z0-9-]+\.(?:com|in|co\.in|org|net|xyz|top|click|ly|tk|ml|ga|cf|online|site|live|link|info|shop|vip|icu|buzz|at|gy|gd|cc))\/?[^\s"'<>]*)/gi;

  const rawMatches = text.match(urlRegex) ?? [];
  const uniqueUrls = Array.from(new Set(rawMatches.map((u) => u.replace(/[.,;!?)]+$/, ''))));

  const findings: UrlFinding[] = [];

  for (const rawUrl of uniqueUrls.slice(0, 8)) {
    const flags: string[] = [];
    let riskPoints = 0;

    // Special check for UPI deep links
    if (/^upi:\/\//i.test(rawUrl)) {
      flags.push('upi_payment_deep_link');
      riskPoints += 25;
      if (/[?&]am=\d+/i.test(rawUrl)) {
        flags.push('upi_prefilled_amount');
        riskPoints += 15;
      }
      findings.push({
        rawUrl,
        displayUrl: rawUrl.replace(/(pa=)([^&\s]+)/gi, '$1[UPI_ID_MASKED]').slice(0, 120),
        hostname: 'upi://pay',
        riskPoints: Math.min(riskPoints, 60),
        flags,
        isOfficialAllowlisted: false,
      });
      continue;
    }

    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    let hostname = '';
    let pathname = '';
    let protocol = 'https:';

    try {
      const parsed = new URL(normalized);
      hostname = parsed.hostname.toLowerCase();
      pathname = `${parsed.pathname}${parsed.search}`.toLowerCase();
      protocol = parsed.protocol;
      if (parsed.username || parsed.password) {
        flags.push('url_credential_trick');
        riskPoints += 30;
      }
    } catch {
      hostname = rawUrl.split('/')[0].toLowerCase();
      flags.push('malformed_url');
      riskPoints += 20;
    }

    const cleanHost = hostname.replace(/^www\./, '');
    const allowlisted = isDomainAllowlisted(cleanHost);

    if (!allowlisted) {
      if (URL_SHORTENERS.has(cleanHost)) {
        flags.push('shortened_url_hides_destination');
        riskPoints += 35;
      }

      if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(cleanHost)) {
        flags.push('raw_ip_address_link');
        riskPoints += 40;
      }

      if (/^http:\/\//i.test(rawUrl) || protocol === 'http:') {
        flags.push('insecure_http_link');
        riskPoints += 15;
      }

      if (cleanHost.includes('xn--')) {
        flags.push('punycode_lookalike_domain');
        riskPoints += 35;
      }

      if (RISKY_TLDS.some((tld) => cleanHost.endsWith(tld))) {
        flags.push('high_risk_domain_extension');
        riskPoints += 25;
      }

      const fullLower = `${cleanHost}${pathname}`;
      const matchedBrands = IMPERSONATED_BRAND_TOKENS.filter((token) =>
        fullLower.includes(token)
      );
      if (matchedBrands.length > 0) {
        flags.push('unofficial_bank_or_kyc_lookalike');
        riskPoints += 35;
      }

      const hyphenCount = (cleanHost.match(/-/g) ?? []).length;
      const dotCount = (cleanHost.match(/\./g) ?? []).length;
      if (hyphenCount >= 2 || dotCount >= 3) {
        flags.push('suspicious_domain_structure');
        riskPoints += 15;
      }

      if (flags.length === 0) {
        flags.push('unverified_external_link');
        riskPoints += 10;
      }
    }

    findings.push({
      rawUrl,
      displayUrl: rawUrl.slice(0, 120),
      hostname: cleanHost || rawUrl.slice(0, 60),
      riskPoints: Math.min(riskPoints, 70),
      flags,
      isOfficialAllowlisted: allowlisted,
    });
  }

  const totalUrlRiskPoints = Math.min(
    70,
    findings.reduce((sum, f) => sum + f.riskPoints, 0)
  );

  return {
    urlsFound: findings.length,
    findings,
    totalUrlRiskPoints,
  };
}
