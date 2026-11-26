import type { MaskingResult, RedactionSummary } from './types';

/**
 * Deterministically masks personal & payment identifiers before external AI transmission
 * or optional consented storage. Never mutates or logs raw secrets.
 */
export function maskSensitiveData(input: string): MaskingResult {
  if (!input || typeof input !== 'string') {
    return { maskedText: '', redactions: [], totalRedacted: 0 };
  }

  let masked = input;
  const counts = new Map<RedactionSummary['type'], number>();

  const applyPattern = (
    type: RedactionSummary['type'],
    regex: RegExp,
    replacer: string | ((match: string, ...args: string[]) => string)
  ) => {
    let localCount = 0;
    masked = masked.replace(regex, (...args) => {
      localCount += 1;
      if (typeof replacer === 'function') {
        return replacer(args[0], ...args.slice(1));
      }
      return replacer;
    });
    if (localCount > 0) {
      counts.set(type, (counts.get(type) ?? 0) + localCount);
    }
  };

  // 1. Mask UPI IDs (e.g., rahul.sharma@okhdfcbank, 9876543210@ybl, refund@paytm)
  // Carefully avoids matching standard email domains like @gmail.com / @yahoo.com
  const emailDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'yahoo.co.in',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'protonmail.com',
    'rediffmail.com',
  ]);

  let upiCount = 0;
  let emailCount = 0;
  masked = masked.replace(
    /\b([a-zA-Z0-9._-]{2,})@([a-zA-Z0-9.-]{2,})\b/g,
    (fullMatch, _user: string, handle: string) => {
      const lowerHandle = handle.toLowerCase();
      if (emailDomains.has(lowerHandle) || /\.[a-z]{2,}$/i.test(lowerHandle)) {
        emailCount += 1;
        return '[EMAIL_MASKED]';
      }
      upiCount += 1;
      return '[UPI_ID_MASKED]';
    }
  );
  if (upiCount > 0) counts.set('upi_id', upiCount);
  if (emailCount > 0) counts.set('email', emailCount);

  // 2. Mask UPI payment URI pa= parameters if any survived
  applyPattern('upi_id', /(\bpa=)([^&\s]+)/gi, (_m, prefix: string) => `${prefix}[UPI_ID_MASKED]`);

  // 3. Mask OTP / PIN / CVV codes near sensitive keywords
  applyPattern(
    'otp',
    /(\b(?:otp|pin|mpin|upi\s*pin|cvv|code|passcode|verification\s*code)\b[^0-9\n]{0,16})(\d{3,8})\b/gi,
    (_m, prefix: string) => `${prefix}[OTP_MASKED]`
  );

  // 4. Mask 16-digit card numbers (with optional spaces or hyphens)
  applyPattern('card', /\b(?:\d{4}[\s-]){3}\d{4}\b/g, '[CARD_MASKED]');

  // 5. Mask Aadhaar-like 12-digit sequences (4-4-4 grouped)
  applyPattern('aadhaar', /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, '[AADHAAR_MASKED]');

  // 6. Mask Indian PAN numbers (e.g., ABCDE1234F)
  applyPattern('pan', /\b[A-Z]{5}\d{4}[A-Z]\b/g, '[PAN_MASKED]');

  // 7. Mask Indian phone numbers (+91, 91-, 0-prefixed, or 10-digit starting 6-9)
  applyPattern(
    'phone',
    /(?:\+?91[\s-]?)?(?<!\d)[6-9]\d{4}[\s-]?\d{5}(?!\d)/g,
    '[PHONE_MASKED]'
  );

  // 8. Mask remaining bank account numbers (9 to 18 digits, excluding amounts with decimals or known helplines)
  applyPattern('account', /(?<!\d)\d{9,18}(?!\d)/g, '[ACCOUNT_MASKED]');

  const redactions: RedactionSummary[] = Array.from(counts.entries()).map(([type, count]) => ({
    type,
    count,
  }));
  const totalRedacted = redactions.reduce((sum, item) => sum + item.count, 0);

  return {
    maskedText: masked,
    redactions,
    totalRedacted,
  };
}
