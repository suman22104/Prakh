# System Architecture — Parakh

## 1. High-Level Architecture

Parakh runs as a lightweight, mobile-first full-stack web application on a single Express + Vite server (port 3000), paired with an installable Progressive Web App (PWA) shell and privacy-first dual persistence.

```
Browser PWA (React + Vite + Tailwind + Workbox SW)
 ├── Pages: Landing | Scam Checker | Analysis Result | Dashboard | Assisted Mode | Reviewer | Status
 ├── Shared Pure Modules (shared/):
 │    ├── masking.ts      (Deterministic phone, UPI VPA, OTP, A/c, PAN, Aadhaar, card, email redaction)
 │    ├── urlAnalyzer.ts  (Static lexical link inspection — NEVER fetches or opens URLs)
 │    ├── interopCheck.ts (Offline UPI PSP bank-handle & IFSC prefix lookup — zero external calls)
 │    └── ruleEngine.ts   (Multilingual EN/HI/BN scam rules + offline fallback)
 └── Persistence & Sync:
      ├── Ephemeral RAM map for non-consented checks (zero storage default)
      ├── Device Offline Queue (masked only; requires manual renewed consent on reconnect)
      └── Firebase Firestore (strictly consented analyses, consents, reviewCases, auditLogs)
            │
            ▼  HTTPS REST API (/api/analyze, /api/health, /api/test-cases, /api/translate, /api/tts)
Express Backend (server.ts + server/src/)
 ├── Security Middleware: Helmet, Scoped CORS, Rate Limiting (45 req/min on /api/analyze)
 ├── Input Validator: Rejects empty input, >2500 chars, unsupported languages, missing consent
 └── Hybrid Analysis Service:
      ├── 1. Local Deterministic Rule + URL + Bank-Handle Interoperability Baseline
      ├── 2. Explicit Consent Gate (allowExternalAi === true required)
      ├── 3. Modular AI Provider Adapter (Gemini gemini-2.5-flash | Groq | Ollama | Rules)
      ├── 4. Strict Backend JSON Schema Validator (aiResponseValidator.ts)
      └── 5. Safety-First Fusion & Transparent Rule-Based Fallback
```

## 2. Pillar-to-Journey Mapping

- **Privacy & Consent**: Applies on `/check` (live masking preview and explicit opt-in checkboxes) and `/dashboard` (delete-all-history and consent ledger) before any AI call or save — without it, citizens' phone numbers, UPI IDs, and OTPs would leak to third-party LLM APIs or persist without permission, destroying trust.
- **Inclusive Access**: Applies across the sticky language bar (`EN` / `हिन्दी` / `বাংলা`), `/assisted` helper desk, voice input on `/check`, and Read Aloud on `/` and `/result/:id` — without it, elderly users and non-English-speaking shopkeepers cannot read technical scam warnings in time to stop a transfer.
- **Low-Bandwidth & Offline**: Applies when the browser loses mobile data on `/check` or `/` (PWA service worker, offline UPI Golden Rules, local rule engine, and manual-consent Offline Queue on `/dashboard`) — without it, checks fail mid-transaction on congested 3G/4G networks or silently upload queued private messages upon reconnect.
- **Auditability & Human Oversight**: Applies on `/result/:id` (optional consented human-review escalation) and `/reviewer` (Firebase-authenticated reviewer queue, case status workflow, and audit log) — without it, ambiguous or novel fraud scripts have no safe human escalation path and reviewers could view private unconsented messages.
- **Interoperability Signal (`shared/interopCheck.ts`)**: Applies inside the detection pipeline and renders on `/` and `/result/:id` (`Recipient bank handle: recognized / not recognized` and masked IFSC prefix check) — without it, spoofed or non-existent UPI bank suffixes (`@fakekycbank`) and bogus IFSC prefixes slip past keyword-only rules when the scammer uses polite phrasing.

## 3. Privacy & Security Guarantees

1. **Masking Before Transmission**: Sensitive identifiers are redacted in the browser preview and again on the server before any external AI prompt is constructed; the interoperability checker only passes bank suffixes (`@ybl`) or masked IFSC prefixes (`SBIN0******`) — never personal VPA local-parts.
2. **Zero Raw Storage by Default**: Unless the citizen explicitly enables storage consent, the result is held only in transient React memory for the current view and never written to Firestore or browser storage.
3. **Database-Enforced Human Review Auth & Consent**: `/reviewer` is gated by **Firebase Authentication (Google Sign-In with verified email)** and `firestore.rules`, which mathematically reject any `/reviewCases` write or reviewer read unless `isAdmin()` and `consentHumanReview == true`, and block admins from reading private `/analyses` that were not consented for review.
4. **Static URL Inspection**: Suspicious links are parsed lexically as strings (checking URL shorteners, raw IP hosts, `http://`, risky TLDs, punycode, `upi://pay` deep links, and bank/KYC lookalikes) without making any outbound HTTP requests.
5. **Server-Side Secret Boundaries**: All AI provider API keys reside exclusively in server-side `process.env` and never appear in client bundles.

## 4. Scale & Operations (First-District Pilot)

All throughput, latency, and cost figures below are order-of-magnitude estimates based on Gemini's published token pricing for `gemini-2.5-flash` and typical single-container Express throughput.

- **Estimated Peak-Day & Concurrent Volume**: For a first-district pilot reaching roughly 100,000 active UPI users (targeting 5–8% daily usage during salary week or festive sale fraud spikes), estimated peak-day load is **15,000–25,000 checks/day**, with evening rush peaks (6–9 PM IST) of roughly **10–20 concurrent requests/second**. Because deterministic rules, masking, static URL analysis, and bank-handle interoperability run locally on-device (~70–80% of checks in privacy-only/offline mode), a single stateless Express container (1 vCPU / 512 MB RAM) comfortably absorbs consented hybrid AI bursts while keeping estimated p95 latency **under 2s**.
- **Estimated Per-Check Cost**:
  - **Deterministic rule + URL + interoperability check (privacy-only / offline fallback)**: **₹0** per check (runs in-browser or on existing Node compute with negligible CPU overhead).
  - **Consented Hybrid AI check (`gemini-2.5-flash`)**: Estimated at roughly **₹0.03–₹0.05 per check** (~600 input tokens + ~250 output tokens per masked check) under standard paid Gemini API pricing, and **₹0** within Google AI Studio free-tier daily quota during early pilot testing. At an estimated 25,000 peak-day checks where ~25% opt into external AI (~6,000 AI calls/day), estimated peak daily AI spend stays at **roughly ₹300–₹350/day**.
- **First-City Rollout Plan — Kolkata**:
  1. **Weeks 1–4 (Ward Micro-Pilot — 500 Kirana Shops & Senior Citizen Hubs)**: Deploy PWA QR standees in Bengali, Hindi, and English across neighbourhood kirana stores, pharmacies, and senior welfare associations in **South Kolkata (Gariahat / Ballygunge), Salt Lake (Bidhannagar), and Howrah**. Train local shopkeepers to use **Assisted Mode (`/assisted`)** with read-aloud audio when customers receive urgent KYC or collect-request messages.
  2. **Weeks 5–8 (Municipal Expansion & Human Oversight Loop)**: Expand across 25 **Kolkata Municipal Corporation (KMC)** wards in partnership with college NSS volunteers and local cyber-awareness desks onboarded as verified Firebase reviewers on `/reviewer` to triage consented `UNCERTAIN` escalations and feed emerging local Bengali/Hindi scam templates back into `shared/ruleEngine.ts`.
  3. **Weeks 9–12 (District Corridor Scale)**: Extend to **North 24 Parganas and South 24 Parganas** peri-urban markets with periodic offline-pack updates (participating UPI bank handles + seasonal scam rules) and direct **1930 / cybercrime.gov.in** referral cards.

## 5. Known Limitations & False-Positive Policy

- **Non-Calibrated Heuristic Scores**: The `0–100` risk score and `LOW`/`MEDIUM`/`HIGH` confidence labels are heuristic indicators to assist human judgment, not statistically calibrated probabilities.
- **Offline Bank-Handle Directory Scope**: `shared/interopCheck.ts` validates against a synthetic offline list of major NPCI/UPI PSP handles and IFSC bank prefixes (no live NPCI lookup). Newly launched niche PSP handles may appear as "not recognized", and conversely scammers frequently abuse legitimate PSP handles (`@ybl`, `@okicici`, `@paytm`) — so a recognized handle is never proof of legitimacy.
- **False Positives**: Legitimate bank or utility notifications that include urgent language and a third-party short link may trigger `SUSPICIOUS`. Users are always guided to verify inside their official banking app.
- **False Negatives**: Novel social-engineering scripts with polite wording and freshly registered neutral domains may be scored `UNCERTAIN` or `SAFE`. Every result displays a mandatory advisory notice stating that automated checks cannot guarantee safety.
- **Browser Speech Support**: Web Speech API voice input and Hindi/Bengali voices vary across operating systems and browsers; all functionality works cleanly via text when speech APIs are unavailable.
