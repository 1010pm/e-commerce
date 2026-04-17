# Frontend Integration Guide - paymentSessions Schema

**Date:** April 16, 2026  
**Purpose:** Show React components how to query, display, and use the new hybrid Firestore structure

---

## Quick Reference

| Use Case | Field | Type | Example |
|----------|-------|------|---------|
| Display amount to user | `amountOMR` | `number` | `5.0` |
| Show formatted currency | Use `amountOMR.toFixed(3)` | `string` | `"5.000 OMR"` |
| Check if paid | `isPaid` | `boolean` | `true` |
| Show transaction ID | `invoice` | `string` | `"2026041636601"` |
| Debug API response | `raw` | `object` | Full Thawani response |
| Query by status | `status` | `string` | `"paid"` |
| Filter by user | `userId` | `string` | Firebase UID |

---

## 🛒 Frontend Components

### 1. Payment Success Display

**Location:** `src/pages/PaymentSuccess.jsx`

```jsx
import { db } from '../config/firebase.config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

export default function PaymentSuccess() {
  const [session, setSession] = useState(null);
  const { user } = useAuth();
  const { sessionId } = useParams();

  useEffect(() => {
    if (!sessionId || !user) return;

    // ✅ Query the new hybrid structure
    const getSession = async () => {
      try {
        const sessionDoc = await getDoc(
          doc(db, 'paymentSessions', sessionId)
        );
        
        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          
          // Security check
          if (data.userId !== user.uid) {
            throw new Error('Permission denied');
          }
          
          setSession(data);
          
          // Log for debugging
          console.log('📦 [PAYMENT SUCCESS] Session loaded:', {
            sessionId,
            amount_omr: data.amountOMR,
            status: data.status,
            isPaid: data.isPaid,
            invoice: data.invoice,
          });
        }
      } catch (error) {
        console.error('❌ Failed to load session:', error);
      }
    };

    getSession();
  }, [sessionId, user]);

  if (!session) return <div>Loading...</div>;

  return (
    <div className="payment-success">
      {/* Amount Display - NEVER uses raw calculation */}
      <div className="success-amount">
        <h1>Payment Confirmed</h1>
        
        {/* ✅ CORRECT: Use amountOMR directly */}
        <div className="amount">
          {session.amountOMR.toFixed(3)} OMR
        </div>
        
        {/* Transaction ID */}
        <p className="invoice">
          Transaction: {session.invoice || session.sessionId}
        </p>
      </div>

      {/* Order Details */}
      <OrderDetails session={session} />

      {/* Debug Panel (Admin Only) */}
      {user?.isAdmin && (
        <DebugPanel session={session} />
      )}
    </div>
  );
}

// Helper component for order details
function OrderDetails({ session }) {
  return (
    <div className="order-details">
      <h2>Order Details</h2>
      
      <div className="customer">
        <strong>Customer:</strong> {session.customer?.name}
      </div>

      {/* Products from structured data */}
      <div className="products">
        <strong>Items:</strong>
        <ul>
          {session.products?.map((product, idx) => (
            <li key={idx}>
              {product.name} × {product.quantity}
              {' '}
              ({(product.unit_amount / 1000).toFixed(3)} OMR)
            </li>
          ))}
        </ul>
      </div>

      <div className="status">
        <strong>Status:</strong>
        {session.isPaid ? (
          <span className="badge-success">✅ Paid</span>
        ) : (
          <span className="badge-pending">⏳ Pending</span>
        )}
      </div>
    </div>
  );
}

// Admin debug panel
function DebugPanel({ session }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="debug-panel" style={{ backgroundColor: '#f5f5f5', padding: '12px', marginTop: '20px' }}>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? '🔽' : '▶️'} Debug Info
      </button>
      
      {expanded && (
        <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

---

### 2. Admin Payments Table

**Location:** `src/components/admin/PaymentsTable.jsx`

```jsx
import { db } from '../../config/firebase.config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function PaymentsTable() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Query using indexed fields from hybrid structure
    const q = query(
      collection(db, 'paymentSessions'),
      where('status', '==', 'paid'),
      orderBy('updatedAt', 'desc')
    );

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPayments(data);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error loading payments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading payments...</div>;

  return (
    <table className="payments-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(payment => (
          <tr key={payment.id}>
            {/* Date */}
            <td>
              {new Date(payment.createdAt?.toDate?.()).toLocaleDateString()}
            </td>

            {/* Invoice/Transaction ID */}
            <td className="invoice">
              {payment.invoice || '—'}
            </td>

            {/* Customer Name */}
            <td>
              {payment.customer?.name || 'Unknown'}
            </td>

            {/* Amount - ALWAYS use amountOMR with .toFixed(3) */}
            <td className="amount">
              <strong>
                {payment.amountOMR?.toFixed(3) || '0.000'} OMR
              </strong>
              <small style={{ color: '#999' }}>
                ({payment.amount || '0'} baisa)
              </small>
            </td>

            {/* Status */}
            <td>
              <StatusBadge session={payment} />
            </td>

            {/* Actions */}
            <td>
              <button onClick={() => showDetails(payment)}>
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Status badge using isPaid flag
function StatusBadge({ session }) {
  if (session.isPaid) {
    return <span className="badge-paid">✅ Paid</span>;
  }
  if (session.status === 'failed') {
    return <span className="badge-failed">❌ Failed</span>;
  }
  return <span className="badge-pending">⏳ Pending</span>;
}

// Show full session details in modal
function showDetails(payment) {
  const modalContent = `
    Session ID: ${payment.sessionId}
    Invoice: ${payment.invoice}
    Amount: ${payment.amountOMR.toFixed(3)} OMR
    Status: ${payment.status}
    Customer: ${payment.customer?.name}
    
    Full Raw Response:
    ${JSON.stringify(payment.raw, null, 2)}
  `;
  
  alert(modalContent);
}
```

---

### 3. Query Patterns - React Hook

**Location:** `src/hooks/usePaymentSessions.js` (NEW)

```js
import { useEffect, useState } from 'react';
import { db } from '../config/firebase.config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

/**
 * Hook to fetch payment sessions with various filters
 * Usage: const { sessions, loading, error } = usePaymentSessions({ userId, status });
 */
export function usePaymentSessions({ userId, status = null, limit: limitCount = 20 } = {}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      try {
        // Build query with userId as required filter
        let queryConstraints = [
          where('userId', '==', userId),
        ];

        // Add optional status filter
        if (status) {
          queryConstraints.push(where('status', '==', status));
        }

        // Order by creation date (most recent first)
        queryConstraints.push(orderBy('createdAt', 'desc'));

        // Limit results
        queryConstraints.push(limit(limitCount));

        // Execute query
        const q = query(collection(db, 'paymentSessions'), ...queryConstraints);
        const snapshot = await getDocs(q);

        // Map results with ID
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSessions(data);
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching sessions:', err);
        setError(err.message);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userId, status, limitCount]);

  return { sessions, loading, error };
}

// Usage in component:
// const { sessions, loading } = usePaymentSessions({ userId: user.uid, status: 'paid' });
```

---

### 4. Payment History Component

**Location:** `src/components/PaymentHistory.jsx`

```jsx
import { usePaymentSessions } from '../hooks/usePaymentSessions';
import { useAuth } from '../hooks/useAuth';

export default function PaymentHistory() {
  const { user } = useAuth();
  const { sessions, loading, error } = usePaymentSessions({
    userId: user?.uid,
    status: 'paid',
    limit: 50,
  });

  if (loading) return <div>Loading payment history...</div>;
  if (error) return <div>Error: {error}</div>;
  if (sessions.length === 0) return <div>No payments found</div>;

  return (
    <div className="payment-history">
      <h2>Payment History</h2>
      
      <div className="summary">
        <strong>Total Payments:</strong> {sessions.length}
        
        {/* Calculate total using hybrid structure */}
        <strong>Total Amount:</strong>{' '}
        {(
          sessions.reduce((sum, s) => sum + (s.amountOMR || 0), 0).toFixed(3)
        )}{' '}
        OMR
      </div>

      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice</th>
            <th>Amount</th>
            <th>Products</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>
                {new Date(session.createdAt?.toDate?.()).toLocaleDateString()}
              </td>
              <td>{session.invoice || session.sessionId}</td>
              <td>
                <strong>
                  {session.amountOMR?.toFixed(3) || '0.000'} OMR
                </strong>
              </td>
              <td>
                {session.products?.map(p => p.name).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📋 Common Helper Functions

**Location:** `src/utils/paymentHelpers.js` (NEW or ADD TO EXISTING)

```js
/**
 * Payment Session Helpers - Work with hybrid Firestore structure
 */

/**
 * Get display amount that's safe to show to user
 * Priority: amountOMR → amount/1000 → 0
 */
export function getDisplayAmount(session) {
  return session?.amountOMR || (session?.amount ? session.amount / 1000 : 0);
}

/**
 * Get formatted amount string with currency
 */
export function formatSessionAmount(session) {
  const amount = getDisplayAmount(session);
  return `${amount.toFixed(3)} OMR`;
}

/**
 * Get transaction ID or fallback to session ID
 */
export function getTransactionId(session) {
  return session?.invoice || session?.sessionId || 'N/A';
}

/**
 * Check if session is actually paid (use isPaid flag for performance)
 */
export function isSessionPaid(session) {
  return session?.isPaid === true;
}

/**
 * Get short status label for UI
 */
export function getStatusLabel(session) {
  if (isSessionPaid(session)) return '✅ Paid';
  if (session?.status === 'failed') return '❌ Failed';
  if (session?.status === 'pending') return '⏳ Pending';
  return `⚪ ${session?.status || 'Unknown'}`;
}

/**
 * Get session detail for display (multi-line summary)
 */
export function getSessionSummary(session) {
  return `
    Invoice: ${getTransactionId(session)}
    Amount: ${formatSessionAmount(session)}
    Status: ${getStatusLabel(session)}
    Customer: ${session?.customer?.name || 'Unknown'}
    Date: ${session?.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
  `.trim();
}

/**
 * Check if session data looks valid
 */
export function validateSessionData(session) {
  const issues = [];
  
  if (!session.sessionId) issues.push('Missing sessionId');
  if (!session.userId) issues.push('Missing userId');
  if (session.amountOMR === undefined || session.amountOMR === null) {
    issues.push('Missing amountOMR');
  }
  if (session.amountOMR && session.amountOMR < 0) {
    issues.push('amountOMR is negative');
  }
  if (!session.status) issues.push('Missing status');
  if (!session.raw) issues.push('Missing raw Thawani response');
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Usage:
// import { formatSessionAmount, getTransactionId } from '../utils/paymentHelpers';
// <span>{formatSessionAmount(session)}</span>
// <span>Invoice: {getTransactionId(session)}</span>
```

---

## ✅ Correct Usage Examples

### ❌ WRONG - Don't do this:
```jsx
// ❌ WRONG: Calculating amount from raw response
const amount = session.raw.data.total_amount / 1000;

// ❌ WRONG: Using raw fields directly
const invoice = session.raw.data.invoice;

// ❌ WRONG: Checking nested status
if (session.raw.data.payment_status === 'paid') { }
```

### ✅ CORRECT - Do this:
```jsx
// ✅ CORRECT: Use computed field
const amount = session.amountOMR;

// ✅ CORRECT: Use flattened field
const invoice = session.invoice;

// ✅ CORRECT: Use isPaid flag
if (session.isPaid) { }

// ✅ If you need raw data, use it
const fullThawaniResponse = session.raw;
```

---

## 🧪 Testing in Firestore Console

### Query all paid sessions:
```
Collection: paymentSessions
Filter: status == "paid"
Order by: updatedAt (descending)
```

### Query user's sessions:
```
Collection: paymentSessions
Filter: userId == "YOUR_UID"
Order by: createdAt (descending)
```

### View single session:
```
Collection: paymentSessions
Document: checkout_ABC123
Fields visible:
  - amountOMR ✅
  - invoice ✅
  - isPaid ✅
  - raw.data.* ✅
```

---

## 🚀 Performance Tips

1. **Always filter by `userId` first** - Most queries should scope to current user
2. **Use indexed fields** - Query on `status`, `invoice`, `createdAt` for speed
3. **Avoid reading `raw` unless needed** - It's large; use computed fields instead
4. **Use pagination in lists** - Use `limit()` to avoid loading too many docs
5. **Cache session data** - Store in React state to avoid repeated reads

---

## 📱 Mobile Considerations

```jsx
// For mobile, show less data, avoid raw response
export function PaymentSummaryMobile({ session }) {
  return (
    <div className="payment-summary-mobile">
      <div className="amount">{session.amountOMR?.toFixed(3)} OMR</div>
      <div className="status">{getStatusLabel(session)}</div>
      <div className="invoice">{getTransactionId(session)}</div>
    </div>
  );
}
```

---

## 🐛 Debugging Checklist

If display isn't working:

- [ ] ✅ Check `session.amountOMR` exists and is a number
- [ ] ✅ Check `session.userId` matches current user
- [ ] ✅ Check `session.raw` is not empty (should have full Thawani response)
- [ ] ✅ Check Firestore rules allow read access to user's sessions
- [ ] ✅ Check timestamps with `.toDate()` for date fields
- [ ] ✅ Log `session` object to console to inspect structure

---

## Related Files

- **Schema Definition:** [FIRESTORE_PAYMENT_SESSIONS_SCHEMA.md](FIRESTORE_PAYMENT_SESSIONS_SCHEMA.md)
- **Payment System Audit:** [PAYMENT_SYSTEM_AUDIT.md](PAYMENT_SYSTEM_AUDIT.md)
- **Backend Implementation:** `functions/src/thawani.ts`
- **Services:** `src/services/paymentsService.js`

---

**Last Updated:** April 16, 2026  
**Status:** ✅ Ready for implementation
