# Parakh — Check before you pay

**Track:** Code Relay 5.0, IIT Bhubaneswar - Domain: FinTech, Track: Financial Inclusion.

**Parakh** (`परख` / `পরখ`) is a privacy-first, multilingual UPI scam-warning Progressive Web App (PWA) designed to help Indian citizens, senior citizens, and local shop helpers verify suspicious SMS messages, WhatsApp forwards, web links, and UPI payment requests **before** sending money or sharing OTPs.

---

## Problem & Users

Our last-mile users are first-time UPI users, pensioners, and neighbourhood kirana shopkeepers in India who navigate digital payments in Bengali, Hindi, or basic English on low-cost smartphones. Because UPI transfers settle almost instantly and are difficult to reverse once a PIN is entered, a single deceptive collect request, fake KYC suspension SMS, or phishing link can wipe out household savings or daily shop working capital before anyone around them can step in to warn them.

---

## Core Capabilities

- **Hybrid Scam Detection Engine**: Combines deterministic Indian digital-payment safety rules, static lexical URL inspection (links are never visited or opened), offline UPI bank-handle / IFSC interoperability checks (`shared/interopCheck.ts`), and a modular AI provider adapter (**Gemini `gemini-2.5-flash`** primary free-tier model, plus optional **Groq** and **Ollama** adapters) with automatic, transparently labeled rule-based fallback.
- **Privacy & Consent by Default**:
  - Automatic masking of phone numbers, UPI IDs, OTP/PIN codes, bank account numbers, Aadhaar-like numbers, PAN, card numbers, and emails before AI transmission or storage.
  - Zero storage of raw messages by default.
  - Separate explicit opt-in consent toggles for external AI analysis, masked verdict history storage, and human reviewer escalation.
  - One-click **Delete All History** and immutable consent tracking.
- **Inclusive Access**:
  - Full interface and plain-language explanations in **English**, **हिन्दी (Hindi)**, and **বাংলা (Bengali)**.
  - Web Speech API **Read-Aloud (TTS)** and **Voice Input (STT)** where supported by the browser.
  - Dedicated **Assisted Mode** with large readable typography, read-aloud privacy notice, and verbal consent confirmation for family members and kirana/shop helpers.
- **Low-Bandwidth & Offline PWA**:
  - Installable Progressive Web App with service worker caching of UI and offline UPI Golden Rules.
  - Instant on-device rule-based scam checks when offline.
  - Offline Request Queue that **never** auto-submits queued items without explicit renewed user consent.
- **Auditability & Human Oversight**:
  - Verified Reviewer Dashboard showing **only** explicitly consented masked cases, case status workflow (`PENDING` → `REVIEWED` / `ESCALATED` / `CLOSED`), reviewer notes, and PII-free operational audit logs.
  - Advisory-only design: never guarantees 100% safety and never executes automatic reporting, blocking, or financial actions.

---

## Pillar-to-Journey Coverage

- **Privacy & Consent**: Applies on `/check` (live PII masking preview and opt-in consent toggles) and `/dashboard` (delete-all-history and consent records) before any AI call or save — without it, sensitive phone numbers, UPI VPAs, and OTPs would be exposed to third-party APIs or stored without consent, breaking user trust.
- **Inclusive Access**: Applies across the persistent language selector (`EN` / `हिन्दी` / `বাংলা`), `/assisted` helper desk, voice dictation on `/check`, and Read Aloud on `/` and `/result/:id` — without it, non-English speakers and elderly citizens cannot understand risk warnings fast enough to stop a fraudulent transfer.
- **Low-Bandwidth & Offline**: Applies on `/` and `/check` whenever connectivity drops (cached PWA shell, offline UPI Golden Rules, local rule engine, and manual-consent Offline Queue on `/dashboard`) — without it, payment checks fail on weak mobile data or risk silently uploading queued private messages upon reconnect.
- **Auditability & Human Oversight**: Applies on `/result/:id` (explicit consented escalation) and `/reviewer` (verified reviewer queue, case notes, and audit events) — without it, uncertain cases lack safe human follow-up and reviewers could access unconsented private messages.
- **Interoperability Signal**: Applies inside the shared analysis pipeline (`shared/interopCheck.ts`) and displays on `/` and `/result/:id` (`Recipient bank handle: recognized / not recognized` and masked IFSC prefix status) — without it, unrecognized fake UPI handles (`@fakekycbank`) and invalid IFSC prefixes go unflagged when scammers avoid obvious scam keywords.

---

## Reviewer Access & Auth Enforcement (`/reviewer`)

- **Enforced Auth Mechanism**: `/reviewer` is gated strictly by **Firebase Authentication (Google Sign-In with verified email)** paired with **Firestore Security Rules** — there is **no `ADMIN_PASSCODE`** shortcut in this build.
- **How It Is Enforced End-to-End**:
  1. **UI & Action Guard** (`src/pages/ReviewerDashboardPage.tsx`, `src/contexts/AppContext.tsx`): Unauthenticated visitors and signed-in non-admin users are locked out of the reviewer queue and cannot invoke `updateReviewCaseDecision`, which throws an authorization error unless `user && user.emailVerified && isAdmin`.
  2. **Database-Layer Enforcement** (`firestore.rules`, verified by `firestore.rules.test.ts`): Firestore rules require `request.auth != null && request.auth.token.email_verified == true` and `isAdmin()` (bootstrapped verified reviewer email or server-provisioned `/admins/{uid}` document, with `/admins` locked against all client writes) plus `existing().consentHumanReview == true` before allowing reads or status/note updates on `/reviewCases`. Non-consented citizen `/analyses` remain inaccessible even to admins.

---

## Quick Start & Installation

### Prerequisites
- Node.js 20+ (22+ recommended)
- Optional: Gemini API key (`GEMINI_API_KEY`) for consented hybrid AI checks with `gemini-2.5-flash` (if omitted, the deterministic rule-based fallback runs cleanly).
- Optional: MySQL 8.0+ if deploying outside AI Studio with the provided portable schema (`server/src/database/mysql_schema.sql`).

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env to set GEMINI_API_KEY (or GROQ_API_KEY / OLLAMA_BASE_URL) and AI_PROVIDER

# 3. Run unit tests (10 synthetic cases + masking + URL + interop + validation + AI fallback + Firestore rules)
npm test
npx --yes tsx --test firestore.rules.test.ts

# 4. Start full-stack Express + Vite server on port 3000
npm run dev
```

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

---

## Database Options

1. **AI Studio Live Preview Persistence (Firebase Firestore + Google Auth)**:
   - Hardened `firestore.rules` enforce strict owner isolation, mandatory `consentStorage == true` on `/analyses`, mandatory `consentHumanReview == true` on `/reviewCases`, and verified admin access for reviewers.
2. **Portable MySQL 8.0+ Schema (`server/src/database/mysql_schema.sql`)**:
   - Complete relational schema with `consent_records`, `analysis_records`, `human_review_cases`, and `audit_events` tables for self-hosted MySQL deployments.

---

## Documentation

- Architecture, Scale & Operations, and Limitations: `docs/architecture/ARCHITECTURE.md`
- Synthetic Test Dataset & Edge Cases: `docs/test-cases/SYNTHETIC_TEST_CASES.md`
- 3-Minute Hackathon Demo Script: `docs/DEMO_SCRIPT.md`
- Application Screenshots: `docs/screenshots/`

---

## Advisory Disclaimer

Automated checks are advisory only and cannot guarantee that any message is safe or fraudulent. If you suspect financial fraud in India, immediately call the **National Cybercrime Helpline at `1930`** or file a report at **https://cybercrime.gov.in**.


---

## Repository Structure

```
parakh/
├── frontend/                  # React 19 + Vite + Tailwind CSS PWA
│   ├── index.html
│   ├── vite.config.ts
│   ├── public/                # PWA icons (192x192, 512x512, maskable, apple-touch-icon)
│   └── src/
│       ├── app/               # App.tsx, providers.tsx, router.tsx (React.lazy + Suspense)
│       ├── components/        # Reusable UI (AppShell, ErrorBoundary, MaskedTextView, PWAInstallButton, VerdictBadge)
│       ├── contexts/          # AppContext, LanguageContext
│       ├── hooks/             # useOnlineStatus, usePWAInstall, useSpeech, useTextToSpeech, useLocalizedResult
│       ├── i18n/              # EN / हिन्दी / বাংলা translations
│       ├── pages/             # 7 lazy-loaded routes
│       └── services/          # api.ts, firebase.ts, persistence.ts
├── backend/                   # Express + TypeScript API & production static server
│   ├── server.ts              # Entry point (dev: Vite middleware; prod: serves frontend/dist)
│   └── src/
│       ├── config/            # env.ts
│       ├── database/          # mysql_schema.sql (optional unused self-hosting reference; Firestore is primary)
│       ├── middleware/        # security.ts (Helmet, CORS allowlist, rate limiter)
│       ├── routes/            # api.ts (/api/health, /api/analyze, /api/translate, /api/tts, /api/test-cases)
│       ├── services/          # aiProvider.ts, hybridAnalysisService.ts, speechTranslationService.ts
│       ├── tests/             # engine.test.ts, interop.test.ts
│       └── utils/             # validators.ts, aiResponseValidator.ts
├── shared/                    # Shared TypeScript modules used by both frontend & backend
│   ├── masking.ts, ruleEngine.ts, interopCheck.ts, urlAnalyzer.ts, syntheticDataset.ts, types.ts
├── firebase/                  # Firebase Firestore rules, tests, and config
│   ├── firestore.rules, firestore.rules.test.ts, firebase-applet-config.json, firebase.json
├── docs/                      # Architecture, demo script, synthetic test cases, screenshots
├── .env.example               # Grouped environment variable template
├── .nvmrc                     # Node 22
└── package.json               # Root scripts (dev, build, start, test, lint, clean)
```

---

## How to Install as an App (PWA)

- **Android (Chrome / Edge)**: Open Parakh over HTTPS, tap the **Install App** button in the header (or tap browser menu `⋮` → **Install app**).
- **iPhone / iPad (Safari)**: Tap the **Share** icon (`□↑`) at the bottom of Safari → scroll down and tap **Add to Home Screen**.
- **Desktop (Chrome / Edge)**: Click the **Install** icon in the address bar (or the in-app **Install** button).

---

## Run Locally

```bash
cp .env.example .env
npm install
npm run lint
npm test
npm run dev
```

For a local production build & start:

```bash
npm run build
NODE_ENV=production npm start
```

---

## Deploy

### 1. Render (Single Web Service)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `GEMINI_API_KEY=<your-key>` (optional; falls back to labeled rules-only mode if omitted)
  - `AI_PROVIDER=gemini`
  - `GEMINI_MODEL=gemini-2.5-flash`
  - `ADMIN_EMAIL=<your-google-email>`
  - `VITE_ADMIN_EMAIL=<your-google-email>` *(must be set before `npm run build`)*
  - `APP_URL=https://<your-app>.onrender.com`
  - `ALLOWED_ORIGINS=https://<your-app>.onrender.com`
- *Note*: Render's free tier sleeps after inactivity, so the first request after idle may take 30–50 seconds.

### 2. Firebase
1. Deploy Firestore rules to the named database (`ai-studio-fccc67b4-a7e0-4ccb-9fd5-e89fb10edebc`):
   ```bash
   firebase deploy --only firestore:rules --project gen-lang-client-0980170558
   ```
2. In **Firebase Console → Authentication → Sign-in method**, enable **Google**.
3. In **Firebase Console → Authentication → Settings → Authorized domains**, add `localhost` and your Render domain (`<your-app>.onrender.com`).
