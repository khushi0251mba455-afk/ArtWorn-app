# ArtWorn Security Specification (Phase 0 TDD)

## Data Invariants
1. **PII Isolation**: User profiles (`/users/{userId}`) contain phone, email, and saved street addresses; only the owning user or verified admin can read or write them.
2. **No Self-Assigned Admin**: Users creating `/users/{userId}` can only assign `role == 'customer'` and cannot escalate `role` to `'admin'`.
3. **Owner-Bound Writes**: Orders, custom requests, wishlists, and reviews enforce `incoming().userId == request.auth.uid` on creation.
4. **Master Gate on Subcollections**: `/customRequests/{requestId}/messages/{messageId}` verifies the parent `customRequests/{requestId}` document exists and belongs to `request.auth.uid` or the caller is an admin.
5. **Terminal State Locking**: Once an order or custom request reaches `'Delivered'` or `'Cancelled'`, customers cannot mutate it; only admins can override states.
6. **Verified Identity**: Write operations require a verified email (`request.auth.token.email_verified == true`) or verified phone auth provider (`request.auth.token.firebase.sign_in_provider == 'phone'`).
7. **Storage Guard**: Uploaded images must be `image/*` MIME types and strictly `<= 5MB`.

## Dirty Dozen Adversarial Payloads
1. User creates `/users/u1` with `role: 'admin'` -> `PERMISSION_DENIED`.
2. User updates `/users/u1` changing `role` to `'admin'` -> `PERMISSION_DENIED`.
3. Unverified email user creates `/orders/o1` -> `PERMISSION_DENIED`.
4. User A reads User B's `/orders/o2` -> `PERMISSION_DENIED`.
5. User A lists `/orders` without filtering to `userId == A` -> `PERMISSION_DENIED`.
6. User A sends a message inside User B's `/customRequests/reqB/messages/m1` -> `PERMISSION_DENIED`.
7. Customer adds a shadow field `{ isAdminOverride: true }` to `/customRequests/req1` -> `PERMISSION_DENIED`.
8. Customer updates `/orders/o1` to change `total` from `2999` to `1` -> `PERMISSION_DENIED`.
9. Non-admin writes to `/products/p1` -> `PERMISSION_DENIED`.
10. Customer updates `/reviews/r1` to set `approved: true` -> `PERMISSION_DENIED`.
11. Attacker writes a 1.5KB junk document ID to `/products/...` -> `PERMISSION_DENIED`.
12. Customer updates a `'Delivered'` order -> `PERMISSION_DENIED`.
