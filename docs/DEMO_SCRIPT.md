# 3-Minute Hackathon Demo Script — Parakh

**Target Duration:** 2 minutes 45 seconds (under 3-minute limit)

---

### 0:00 – 0:30 | The Problem & Inclusive Landing Page (`/`)
- Open the **Landing Page** and frame the problem: first-time digital payment users, senior citizens, and local shopkeepers across India face daily KYC expiry SMS scams, fake cashback links, and UPI collect-request traps.
- Click the language selector (`English` → `हिन्दी` → `বাংলা` → `English`) to show instant three-language accessibility with plain, non-technical language.
- Point out the **Offline UPI Golden Rules** and the prominent **Advisory Disclaimer** (never claiming 100% certainty).

### 0:30 – 1:15 | Live Privacy Masking & Hybrid Scam Check (`/check` → `/result/:id`)
- Click **Check a Suspicious Message** (`/check`).
- Load synthetic case **1. Fake KYC Update Message** (contains a phone number, bank account number, urgent KYC deadline, and a lookalike `http://sbi-kyc-update.xyz` link).
- Highlight the **Automatic Privacy Masking Preview** on the right: phone numbers and account numbers are already masked (`[PHONE_MASKED]`, `[ACCOUNT_MASKED]`) before anything leaves the screen.
- Point out the **Privacy & Consent Controls**: storage and external AI are **OFF by default**. Enable storage consent (and optionally external AI) and click **Check for Scam**.
- On the **Analysis Result** page, highlight:
  - Clear red **SCAM — High Danger** verdict with icon + label (color-blind safe), heuristic risk indicator, and transparent assessment mode (Hybrid AI vs. Rule-Based Fallback).
  - Static link inspection confirming the suspicious URL was **never opened**.
  - **Read Aloud** button (Web Speech API) and official **1930 Helpline / cybercrime.gov.in** guidance.

### 1:15 – 1:50 | Assisted Mode for Family & Local Shop Helpers (`/assisted`)
- Open **Assisted Mode** (`/assisted`) and switch to **हिन्दी** or **বাংলা**.
- Show the large high-contrast layout, **Read Privacy Notice Aloud** button, and mandatory **Verbal Consent** confirmation checkbox before checking a citizen's message (stored nowhere by default).

### 1:50 – 2:25 | Dashboard, Offline Resilience & Delete History (`/dashboard`)
- Open **Dashboard** (`/dashboard`) to show risk statistics, saved consented masked history, and the **Consent Ledger**.
- Explain **Offline Mode**: when connectivity drops, the PWA runs the deterministic rule engine locally and lets users save masked messages to the **Offline Queue**, which **never** auto-submits without explicit renewed consent.
- Show the one-click **Delete All History** control.

### 2:25 – 2:55 | Human Oversight, Reviewer Console & Verification Suite (`/reviewer` & `/status`)
- Open **Reviewer** (`/reviewer`) to show strict access protection: unauthorized accounts cannot view private messages, and database rules mathematically restrict the queue to explicitly consented masked cases only.
- Finish on **Status** (`/status`) and click **Run 10 Synthetic Cases** to show all 10 Indian payment scenarios (scams, legitimate bank alert, personal chat, shortened URL, and ambiguous message) passing transparently alongside documented limitations.
