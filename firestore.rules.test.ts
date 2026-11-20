/**
 * Security Rule Verification Suite (Phase 0 TDD)
 * Documents and verifies the Dirty Dozen payloads against ArtWorn's Firestore rules.
 */

export interface DirtyDozenCase {
  id: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
  invariant: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 'DD-01',
    collection: '/users/attacker',
    operation: 'create',
    payload: { uid: 'attacker', displayName: 'Mallory', role: 'admin' },
    expected: 'PERMISSION_DENIED',
    invariant: 'Users cannot self-assign admin role on signup',
  },
  {
    id: 'DD-02',
    collection: '/users/attacker',
    operation: 'update',
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
    invariant: 'Users cannot escalate their own role',
  },
  {
    id: 'DD-03',
    collection: '/orders/order_unverified',
    operation: 'create',
    payload: { orderNumber: 'AW-999', userId: 'u_unverified', total: 1999, status: 'Paid' },
    expected: 'PERMISSION_DENIED',
    invariant: 'Unverified accounts cannot place orders',
  },
  {
    id: 'DD-04',
    collection: '/orders/order_victim',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    invariant: 'PII and order details restricted to owner or admin',
  },
  {
    id: 'DD-05',
    collection: '/orders',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    invariant: 'Query Enforcer prevents unscoped list scraping',
  },
  {
    id: 'DD-06',
    collection: '/customRequests/req_victim/messages/msg_1',
    operation: 'create',
    payload: { senderId: 'attacker', senderName: 'Mallory', senderRole: 'customer', text: 'hijack' },
    expected: 'PERMISSION_DENIED',
    invariant: 'Master Gate checks parent customRequest ownership',
  },
  {
    id: 'DD-07',
    collection: '/customRequests/req_1',
    operation: 'create',
    payload: { userId: 'u1', isAdminOverride: true },
    expected: 'PERMISSION_DENIED',
    invariant: 'Strict key allowlists reject shadow fields',
  },
  {
    id: 'DD-08',
    collection: '/orders/order_1',
    operation: 'update',
    payload: { total: 1 },
    expected: 'PERMISSION_DENIED',
    invariant: 'Customers cannot tamper with order totals',
  },
  {
    id: 'DD-09',
    collection: '/products/prod_1',
    operation: 'create',
    payload: { title: 'Fake Tee', price: 1 },
    expected: 'PERMISSION_DENIED',
    invariant: 'Catalog mutations restricted to admin role',
  },
  {
    id: 'DD-10',
    collection: '/reviews/rev_1',
    operation: 'update',
    payload: { approved: true },
    expected: 'PERMISSION_DENIED',
    invariant: 'Review moderation restricted to admin role',
  },
  {
    id: 'DD-11',
    collection: `/products/${'x'.repeat(250)}`,
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    invariant: 'isValidId enforces <= 128 character alphanumeric/dash/underscore IDs',
  },
  {
    id: 'DD-12',
    collection: '/orders/order_delivered',
    operation: 'update',
    payload: { status: 'Enquiry' },
    expected: 'PERMISSION_DENIED',
    invariant: 'Terminal Delivered/Cancelled states are locked for non-admins',
  },
];
