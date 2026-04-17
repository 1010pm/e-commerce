# paymentSessions Collection - Hybrid Firestore Schema

**Last Updated:** April 16, 2026  
**Status:** ✅ Production Ready

---

## 📋 Overview

The `paymentSessions` collection now uses a **hybrid structure** that combines:
- ✅ **Queryable indexed fields** - Fast UI queries and admin filtering
- ✅ **Full raw Thawani response** - Complete audit trail and debugging capability

This ensures **zero data loss** while maintaining high performance.

---

## 🔑 Document Structure

### Session Document Format
```
/paymentSessions/{sessionId}
```

Where `sessionId` is the Thawani-generated session ID (e.g., `checkout_xxx`)

---

## 📊 Field Reference

### Core Identifiers (Indexed)
```ts
{
  // Thawani unique session identifier - PRIMARY KEY
  sessionId: string,                    // e.g., "checkout_ABC123"
  
  // Thawani client reference (order identifier)
  clientReferenceId: string,            // e.g., "order1713269936abcdef"
  
  // User who initiated payment
  userId: string,                       // Firebase Auth UID
  
  // Related order (if applicable)
  orderId: string,                      // Internal order ID or empty string
}
```

### Amount Fields (Critical for UI Display)
```ts
{
  // Payment status from Thawani
  status: "unpaid" | "paid" | "pending" | "failed",
  
  // ISO currency code
  currency: "OMR",
  
  // Amount in baisa (smallest unit, from gateway)
  // 1 OMR = 1000 baisa
  amount: number,                       // baisa, e.g., 5000 for 5.000 OMR
  
  // Amount in OMR (computed for UI display)
  // ALWAYS = amount / 1000
  amountOMR: number,                    // OMR, e.g., 5.0
  
  // Quick check for already-paid status
  isPaid: boolean,                      // true if status === "paid"
}
```

### Transaction Reference
```ts
{
  // Thawani invoice/transaction ID
  // Populated AFTER payment completion
  invoice: string,                      // e.g., "2026041636601" or empty string
}
```

### Customer Information (Snapshot)
```ts
{
  // Customer data snapshot at time of session creation
  customer: {
    name: string,                       // Full name
    email: string,                      // Email address
    phone: string,                      // Phone number
  },
}
```

### Product Information
```ts
{
  // Cleaned product list from Thawani response
  products: [
    {
      name: string,                     // Product name
      quantity: number,                 // Quantity ordered
      unit_amount: number,              // Price per unit in baisa
    },
    // ... more products
    {
      name: "Shipping",                 // Shipping added as line item
      quantity: 1,
      unit_amount: number,              // Shipping cost in baisa
    }
  ],
}
```

### Redirect URLs
```ts
{
  // Success redirect after payment
  successUrl: string,                   // e.g., "https://domain.com/payment-success"
  
  // Cancel redirect if payment cancelled
  cancelUrl: string,                    // e.g., "https://domain.com/payment-cancel"
}
```

### Metadata & Filtering
```ts
{
  // Flattened metadata for Firestore queries
  metadata: {
    // Any custom fields passed by Thawani
  },
}
```

### Timestamps (Server-Generated)
```ts
{
  // When session was created in Thawani
  createdAt: Timestamp,                 // Firebase Timestamp object
  
  // When session expires (typically 30 minutes)
  expiresAt: Timestamp,                 // Firebase Timestamp object
  
  // Last update time (local server)
  updatedAt: Timestamp,                 // Firebase server timestamp
}
```

### Full Raw Response (🔥 Critical for Debugging)
```ts
{
  // Complete Thawani API response object
  raw: {
    success: boolean,                   // true if successful
    code: number,                       // Thawani response code
    description: string,                // "Session generated successfully"
    data: {
      // Complete Thawani session object
      session_id: string,
      client_reference_id: string,
      invoice: string,
      payment_status: "paid" | "unpaid" | "pending",
      total_amount: number,             // In baisa
      currency: "OMR",
      created_at: "2026-04-16T10:30:00Z",
      expire_at: "2026-04-16T11:00:00Z",
      products: [...],
      metadata: {...},
      success_url: string,
      cancel_url: string,
      // ... all other Thawani fields
    }
  },
}
```

---

## 📋 Complete Example Document

```json
{
  "sessionId": "checkout_ABC123XYZ789",
  "clientReferenceId": "order1713269936user123",
  "userId": "firebase-uid-12345",
  "orderId": "order-001",
  
  "status": "paid",
  "currency": "OMR",
  "amount": 15500,
  "amountOMR": 15.5,
  "isPaid": true,
  
  "invoice": "2026041636601",
  
  "customer": {
    "name": "Ahmed Al-Mansouri",
    "email": "ahmed@example.com",
    "phone": "+96891234567"
  },
  
  "products": [
    {
      "name": "Blue Shirt",
      "quantity": 2,
      "unit_amount": 7000
    },
    {
      "name": "Shipping",
      "quantity": 1,
      "unit_amount": 1500
    }
  ],
  
  "successUrl": "https://mystore.com/payment-success",
  "cancelUrl": "https://mystore.com/payment-cancel",
  
  "metadata": {},
  
  "createdAt": "2026-04-16T10:30:00.000Z",
  "expiresAt": "2026-04-16T11:00:00.000Z",
  "updatedAt": "2026-04-16T10:35:45.123Z",
  
  "raw": {
    "success": true,
    "code": 2004,
    "description": "Session generated successfully",
    "data": {
      "session_id": "checkout_ABC123XYZ789",
      "client_reference_id": "order1713269936user123",
      "invoice": "2026041636601",
      "payment_status": "paid",
      "total_amount": 15500,
      "currency": "OMR",
      "created_at": "2026-04-16T10:30:00Z",
      "expire_at": "2026-04-16T11:00:00Z",
      "products": [{
        "name": "Blue Shirt",
        "quantity": 2,
        "unit_amount": 7000
      }, {
        "name": "Shipping",
        "quantity": 1,
        "unit_amount": 1500
      }],
      "metadata": {},
      "success_url": "https://mystore.com/payment-success",
      "cancel_url": "https://mystore.com/payment-cancel"
    }
  }
}
```

---

## 🔍 Query Examples

### 1. Find all paid sessions for a user
```ts
db.collection('paymentSessions')
  .where('userId', '==', 'user-123')
  .where('status', '==', 'paid')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();
```

### 2. Find session by invoice/transaction ID
```ts
db.collection('paymentSessions')
  .where('invoice', '==', '2026041636601')
  .get();
```

### 3. Find session by Thawani session ID
```ts
db.collection('paymentSessions')
  .doc('checkout_ABC123XYZ789')
  .get();
```

### 4. Get all pending sessions (for admin dashboard)
```ts
db.collection('paymentSessions')
  .where('status', '==', 'unpaid')
  .orderBy('createdAt', 'desc')
  .get();
```

### 5. Find sessions created in last 24 hours
```ts
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

db.collection('paymentSessions')
  .where('createdAt', '>=', yesterday)
  .orderBy('createdAt', 'desc')
  .get();
```

---

## 🛠️ Admin Dashboard Usage

### Display Amount (Never Shows Wrong Value)
```ts
// Priority: amountOMR (computed) → amount/1000 → 0
function getDisplayAmount(session) {
  return session.amountOMR || (session.amount / 1000) || 0;
}

// Usage in UI
<span>{getDisplayAmount(session).toFixed(3)} OMR</span>
```

### Transaction ID Display
```ts
// If payment completed, show invoice
function getTransactionId(session) {
  return session.invoice || session.sessionId || 'Pending';
}

// Usage
<span>{getTransactionId(session)}</span>
```

### Payment Status Badge
```ts
function getStatusBadge(session) {
  if (session.isPaid) return '✅ Paid';
  if (session.status === 'failed') return '❌ Failed';
  return '⏳ Pending';
}
```

### Full Debugging (Admin Only)
```ts
// For debugging panel - show full raw response
<pre>{JSON.stringify(session.raw, null, 2)}</pre>
```

---

## Required Firestore Indexes

Before deploying, create these indexes for optimal query performance:

### Index 1: User Sessions (By creation date)
```
Collection: paymentSessions
Fields: userId ↑, createdAt ↓
```

### Index 2: Payment Status (By status)
```
Collection: paymentSessions
Fields: status ↑, createdAt ↓
```

### Index 3: Unpaid Sessions (For admin)
```
Collection: paymentSessions
Fields: status ↑, userId ↑, createdAt ↓
```

### Index 4: By Invoice
```
Collection: paymentSessions
Fields: invoice ↑
```

---

## 🔒 Security Rules

Recommended Firestore security rules:

```
match /paymentSessions/{sessionId} {
  // Users can only read their own sessions
  allow read: if request.auth.uid == resource.data.userId;
  
  // Only backend (Cloud Functions) can write
  allow write: if request.auth.token.firebase.sign_in_provider == "custom";
  
  // OR allow from specific service account only
  allow write: if request.auth.token.email == 'firebase-admin@project.iam.gserviceaccount.com';
}
```

---

## 💡 Best Practices

### ✅ DO:
- ✅ Always use `amountOMR` field for UI display
- ✅ Always check `isPaid` before marking as completed
- ✅ Query by indexed fields (`userId`, `status`, `invoice`)
- ✅ Store full `raw` response for audit trail
- ✅ Use `updatedAt` to track changes

### ❌ DON'T:
- ❌ Manually calculate `amountOMR` - it's already computed
- ❌ Rely only on `status` field - always check with Thawani API
- ❌ Modify `raw` field after initial save
- ❌ Trust frontend-provided amounts - always use gateway values
- ❌ Delete old payment sessions - keep for audit trail

---

## 🚀 Data Migration Guide

If you have existing payment sessions, run this migration:

```ts
// In Cloud Functions or admin script
async function migratePaymentSessions() {
  const batch = db.batch();
  const sessions = await db.collection('paymentSessions').get();
  
  sessions.forEach(doc => {
    const data = doc.data();
    
    // Add new computed fields
    batch.update(doc.ref, {
      amountOMR: (data.amount || 0) / 1000,
      isPaid: data.status === 'paid',
      raw: data.raw || {
        success: true,
        code: 2000,
        data: {
          session_id: data.sessionId,
          invoice: data.invoice || '',
          total_amount: data.amount || 0,
          payment_status: data.status || 'unpaid',
        }
      },
    });
  });
  
  await batch.commit();
  console.log(`✅ Migrated ${sessions.size} payment sessions`);
}
```

---

## 🔄 Update Flow

### 1. Session Creation (createThawaniSession)
```
createThawaniSession()
  ↓
Extract all fields from Thawani API response.data
  ↓
Save to /paymentSessions/{sessionId} with hybrid structure
  ↓
Include full raw response in 'raw' field
```

### 2. Payment Verification (verifyThawaniPayment)
```
verifyThawaniPayment()
  ↓
Call Thawani API with sessionId
  ↓
Extract latest status, invoice, amount
  ↓
Update only changed fields in /paymentSessions/{sessionId}
  ↓
Update 'raw' with latest response
```

### 3. Admin Dashboard Display
```
getSession(sessionId)
  ↓
Read amountOMR, status, invoice, isPaid
  ↓
Display using helper functions
  ↓
Show raw response in debug panel
```

---

## 📞 Support

For questions about this schema:
1. Check the example document above
2. Review query examples
3. Examine [PAYMENT_SYSTEM_AUDIT.md](PAYMENT_SYSTEM_AUDIT.md)
4. See [PAYMENT_DEPLOYMENT_GUIDE.md](PAYMENT_DEPLOYMENT_GUIDE.md)

---

**Version:** 2.0 (Hybrid Structure - April 16, 2026)  
**Last Updated:** Implementation complete ✅
