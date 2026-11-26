# Synthetic Test Dataset & Failure Mode Verification

All 10 synthetic Indian digital-payment scenarios and 8 edge/failure scenarios are automated in `server/src/tests/engine.test.ts` and can also be run live in the browser via the **Status** page (`/status`).

## Synthetic Message Test Cases

| # | Scenario | Channel | Expected Verdict | Key Signals Tested |
|---|---|---|---|---|
| 1 | Fake KYC Update Message | SMS | `SCAM` | Expired KYC urgency, account-block threat, lookalike `.xyz` HTTP URL, phone & account masking |
| 2 | Fake Bank Account Suspension | SMS | `SCAM` | Account suspension panic, unofficial `.online` HDFC lookalike URL, 24-hour deadline |
| 3 | Suspicious UPI Payment Request | UPI Request | `SCAM` | Collect-request trap claiming PIN is required to receive OLX refund, UPI ID masking |
| 4 | Fake Cashback Offer | WhatsApp | `SCAM` | Scratch-card reward lure paired with `upi://pay?pa=...&am=2500` outgoing payment deep link |
| 5 | Lottery / KBC Prize Scam | WhatsApp | `SCAM` | Unexpected Rs. 25 Lakh prize bait + upfront processing fee demand to UPI ID |
| 6 | OTP Theft Attempt | WhatsApp | `SCAM` | Customer care impersonation + 6-digit OTP request + remote-access app (`AnyDesk`) |
| 7 | Legitimate Bank Notification | SMS | `SAFE` | Standard post-transaction debit SMS with no links, no OTP ask, no urgency |
| 8 | Normal Personal Message | WhatsApp | `SAFE` | Everyday family message with zero financial or phishing cues |
| 9 | Suspicious Shortened URL | URL | `SUSPICIOUS` / `SCAM` | `bit.ly` shortened URL hiding destination + urgent utility notice |
| 10 | Ambiguous Payment Message | WhatsApp | `UNCERTAIN` / `SUSPICIOUS` | Unverified payment reference with low context -> flags uncertainty & advises human verification |

## Automated Edge & Failure Mode Coverage

1. **AI Provider Unavailable**: Simulated upstream timeout -> transparently falls back to deterministic rule engine (`assessmentSource: "rule_based_fallback"`).
2. **Internet Disconnected**: Browser offline status -> runs on-device `offline_rules` engine immediately and supports Offline Queue with manual renewed consent.
3. **Invalid AI Response**: Malformed JSON, unknown verdicts, or out-of-range scores (>100) rejected by `parseAndValidateAiResponse()` -> triggers clean rule fallback.
4. **Missing Consent**: Request without `consent` object rejected (`400 MISSING_CONSENT`); `allowExternalAi: false` guarantees AI provider is never invoked.
5. **Sensitive Data Masking**: Verified redaction of Indian mobile numbers, UPI IDs, OTPs, account numbers, Aadhaar, PAN, and emails.
6. **Database Failure**: Client gracefully notifies user and falls back to device-local consented storage without losing screen interactivity.
7. **Unsupported Language**: Language codes outside `en`, `hi`, `bn` rejected (`400 UNSUPPORTED_LANGUAGE`).
8. **Empty Input**: Blank or whitespace-only input rejected both in client validation and backend API (`400 EMPTY_INPUT`).
