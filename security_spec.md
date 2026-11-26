# Security Specification — Parakh (Firestore Rules TDD)

## 1. Data Invariants

1. **Zero Unconsented Storage**: No `/analyses/{analysisId}` document may be created unless `consentStorage == true` and `ownerId == request.auth.uid`.
2. **Zero Unconsented Human Review**: No `/reviewCases/{caseId}` document may be created or read by an admin unless `consentHumanReview == true`.
3. **Private Message Isolation**: Non-admin users may only read or delete their own documents (`resource.data.ownerId == request.auth.uid`). Admins may never read private `/analyses` or `/reviewCases` where `consentHumanReview != true`.
4. **Immutable Audit & Analysis Records**: `/analyses` and `/auditLogs` cannot be updated after creation.
5. **Verified Identity & Strict Server Timestamps**: Writes require `request.auth.token.email_verified == true` and `createdAt == request.time` (`updatedAt == request.time` on updates).
6. **Admin-Only Review Status Mutations**: Citizens can create a `reviewCase` only with `status == 'PENDING'`, empty `reviewerNotes`, and empty `reviewedBy`. Only verified admins can update `status`, `reviewerNotes`, `reviewedBy`, and `updatedAt`.
7. **Strict Key & Size Bounds**: Every collection enforces exact `hasAll` + `hasOnly` keys, valid ID regex (`^[a-zA-Z0-9_\-]+$`), bounded string lengths, and bounded list lengths.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **Unconsented Analysis Storage**: Creating `/analyses/a1` with `consentStorage: false`.
2. **Identity Spoofing on Create**: Creating `/analyses/a2` with `ownerId: "victim_uid"` while authenticated as `"attacker_uid"`.
3. **Shadow Field Injection**: Creating `/analyses/a3` with extra ghost field `isVerifiedByBank: true`.
4. **Unverified Admin Email Spoof**: Reading `/reviewCases` with `email: process.env.ADMIN_EMAIL` (configured reviewer admin email) and `email_verified: false`.
5. **Unconsented Review Case Injection**: Creating `/reviewCases/c1` with `consentHumanReview: false`.
6. **Citizen Self-Review Shortcut**: Creating `/reviewCases/c2` with `status: "CLOSED"` or non-empty `reviewerNotes`.
7. **Citizen Updating Reviewer Notes**: Non-admin updating `status` or `reviewerNotes` on their own `/reviewCases/c2`.
8. **Admin Accessing Private Non-Consented Analysis**: Admin attempting `get` on `/analyses/a1` where `consentHumanReview == false`.
9. **Oversized ID Poisoning**: Creating `/analyses/${'x'.repeat(200)}` (exceeds 128-char `isValidId` bound).
10. **Forged Client Timestamp**: Creating `/consents/con1` with a backdated `createdAt` instead of `request.time`.
11. **Oversized Warning Signs Array**: Creating `/analyses/a4` with 25 items in `warningSigns` (exceeds max 12).
12. **Self-Assigned Admin Escalation**: Authenticated user writing `/admins/{theirUid}` with `{ role: "admin", active: true }`.
