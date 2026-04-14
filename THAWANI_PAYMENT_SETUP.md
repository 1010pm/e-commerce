# Thawani Payment Gateway - Complete Setup & Implementation Guide

## ✅ Production-Ready Implementation

This guide provides a complete, tested setup for Thawani UAT payment gateway integration with React frontend and Firebase Cloud Functions backend.

## 📋 Table of Contents

1. [Configuration Setup](#configuration-setup)
2. [API Keys Management](#api-keys-management)
3. [Complete Payment Flow](#complete-payment-flow)
4. [Implementation Details](#implementation-details)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)

---

## Configuration Setup

### 1. Firebase Functions Configuration

Set up Thawani credentials in Firebase Functions config:

```bash
# Set Thawani API credentials
firebase functions:config:set thawani.secret="YOUR_THAWANI_SECRET_KEY"
firebase functions:config:set thawani.publishable="YOUR_THAWANI_PUBLISHABLE_KEY"

# Verify configuration
firebase functions:config:get
```

**Expected output:**
```json
{
  "thawani": {
    "secret": "***secret key***",
    "publishable": "***publishable key***"
  }
}
```

### 2. Environment Variables

**Frontend (.env.local):**
```env
# Thawani Configuration
REACT_APP_THAWANI_CHECKOUT_URL=https://uatcheckout.thawani.om/pay
REACT_APP_THAWANI_MOCK_MODE=false  # Set to true for testing without real payments
```

**Backend (functions/.env.local):**
```env
# Firebase Functions
FRONTEND_URL=http://localhost:3000  # or your production URL
```

---

## API Keys Management

### Getting Your Thawani Credentials

1. **Register & Access Thawani Dashboard:**
   - UAT Environment: https://uatcheckout.thawani.om/
   - Get your credentials from the Thawani merchant dashboard

2. **Key Types:**
   - **Secret Key**: Used ONLY in Firebase Functions (backend)
   - **Publishable Key**: Used in payment redirect URL and frontend

3. **Never Expose Secret Key:**
   ✅ Store in Firebase Functions config only
   ❌ Never hardcode in frontend code
   ❌ Never commit to version control
   ❌ Never log in console logs

---

## Complete Payment Flow

### Flow Diagram

```
User (Browser)              React Frontend              Firebase Functions         Thawani API
    |                           |                             |                        |
    |--- Click Pay Button ------>|                             |                        |
    |                           |--- Call createThawani ------>|                        |
    |                           |      Session (secret key)     |                        |
    |                           |                             |--POST /checkout ------>|
    |                           |                             |     /session            |
    |                           |                             |<-- Returns sessionId --|
    |                           |<-- Return sessionUrl -------| (with publishable key)|
    |                           |(with ?key parameter)         |                        |
    |<-- Redirect to Thawani -----|                             |                        |
    |         URL                 |                             |                        |
    |--- User completes payment --|--------------------------- ---|--- Payment Success -|
    |                             |                             |                        |
    |<-- Redirect back to success_url                          |
    |
```

### Step-by-Step Flow

1. **User Initiates Payment**
   - User fills checkout form
   - Clicks "Pay with Thawani"
   - Form validates; item quantities verified

2. **Backend Creates Session**
   ```
   Frontend calls: createThawaniSession({
     amount: 15000,           // in baisa (15 OMR × 1000)
     currency: 'OMR',
     customer: {
       name: 'Ahmed Al-Balushi',
       email: 'ahmed@example.com',
       phone: '+968-91234567'
     },
     items: [
       { name: 'Shoes', quantity: 1, price: 15 }
     ]
   })
   ```

3. **Firebase Function Processes**
   - Validates all input data
   - Retrieves Thawani credentials from config
   - Constructs request payload
   - Sends to Thawani API with Secret Key
   - Receives sessionId from Thawani

4. **Build Checkout URL**
   ```
   sessionUrl = `https://uatcheckout.thawani.om/pay/{sessionId}?key={publishableKey}`
   
   Example:
   https://uatcheckout.thawani.om/pay/abc123xyz789?key=pk_uatnEG4BddKI
   ```

5. **Redirect to Payment Page**
   ```javascript
   window.location.href = sessionUrl;
   ```
   - User redirected to Thawani payment page
   - User enters payment details
   - Thawani processes payment
   - Thawani redirects back to your success_url

6. **Verify Payment**
   - Payment success page verifies session
   - Backend confirms with Thawani API
   - Order created in Firestore

---

## Implementation Details

### Backend: Firebase Cloud Function

**File:** `functions/thawani.js`

**Key Points:**
- ✅ Uses Secret Key (never exposed to frontend)
- ✅ Validates all input data
- ✅ Proper error handling for Thawani API errors
- ✅ Stores session in Firestore for verification
- ✅ Returns sessionUrl with publishable key included

**Response Format:**
```javascript
{
  success: true,
  sessionId: "session_abc123xyz789",
  sessionUrl: "https://uatcheckout.thawani.om/pay/session_abc123xyz789?key=pk_uatnEG4BddKI"
}
```

### Frontend: React Service

**File:** `src/services/thawaniPaymentService.js`

**Key Functions:**

1. **createThawaniSession(config)**
   - Prepares order data
   - Cleanses input to ensure proper types
   - Calls Firebase function
   - Validates response

2. **redirectToThawaniCheckout(sessionUrl)**
   - **Input:** Full checkout URL (with key parameter)
   - Validates URL format and domain
   - Redirects user: `window.location.href = sessionUrl`

3. **verifyThawaniPayment(sessionId)**
   - Called after user returns from Thawani
   - Verifies payment status
   - Creates order if successful

### Frontend: Checkout Page

**File:** `src/pages/CheckoutThawani.jsx`

**Key Features:**
- Form validation before submission
- Loading states with visual feedback
- Stock verification
- Comprehensive error handling
- Mock mode for testing

---

## Testing & Verification

### 1. Local Testing with Mock Mode

**Enable Mock Mode:**
```env
REACT_APP_THAWANI_MOCK_MODE=true
```

**What Happens:**
- Sessions created locally without API calls
- Payments auto-approved
- Perfect for UI/UX testing

### 2. UAT Testing with Real API

**Step 1: Configure Real Keys**
```bash
firebase functions:config:set thawani.secret="sk_uatXXXXXXXXXX"
firebase functions:config:set thawani.publishable="pk_uatXXXXXXXXXX"
```

**Step 2: Disable Mock Mode**
```env
REACT_APP_THAWANI_MOCK_MODE=false
```

**Step 3: Test Payment Flow**

1. Go to checkout page
2. Fill in form with valid data
3. Click "Pay with Thawani"
4. You're redirected to Thawani checkout

**Test Cards (Provided by Thawani):**
- Use test card numbers from Thawani documentation
- Any future expiry date and any CVV

**Step 4: Verify Logs**

Check Firebase Functions logs:
```bash
firebase functions:log --only=createThawaniSession
```

Expected log sequence:
```
✅ [THAWANI] Session URL constructed
✅ Thawani session created: session_123
✅ Session stored in Firestore
✅ Response sent to frontend
```

### 3. Payment Verification

After payment completes:

1. **Check Firestore**
   ```
   paymentSessions/{sessionId}
   - status: 'paid' or 'pending' or 'failed'
   - amount: 15000
   - userId: authenticated user ID
   ```

2. **Check Success Page**
   - User redirected back to your site
   - Order confirmation displayed
   - Email sent to customer

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 404 on Thawani page | Missing/wrong sessionId | Verify sessionUrl includes ?key parameter |
| "Invalid session ID type" | sessionId is not string | Check response from createThawaniSession |
| 400 Bad Request | Invalid data format | Verify amount is integer in baisa |
| 401 Unauthorized | Wrong API key | Verify secret key configured in Firebase |
| 503 Gateway Unavailable | Thawani maintenance | Retry after few minutes |
| Network timeout | Connection issue | Check internet connectivity |

### Debug Logging

Enable detailed logging:

**Frontend Console:**
```javascript
// All Thawani service logs start with [THAWANI-SERVICE] or [CHECKOUT] or [REDIRECT]
// Filter in DevTools: ✅ = success, ❌ = error, 🔗 = redirect
```

**Firebase Functions Logs:**
```bash
firebase functions:log --only=createThawaniSession,verifyThawaniPayment
```

---

## Troubleshooting

### Problem: User Sees 404 After Clicking Pay

**Check:**
1. Is publishable key in the sessionUrl?
   ```
   ✅ Correct: https://uatcheckout.thawani.om/pay/session123?key=pk_uatXXX
   ❌ Wrong:   https://uatcheckout.thawani.om/pay/session123 (missing key)
   ```

2. Is it the correct Thawani domain?
   ```
   ✅ UAT: https://uatcheckout.thawani.om
   ❌ Production (don't use yet): https://checkout.thawani.om
   ```

3. Is sessionId case-sensitive?
   ```
   Yes! Don't modify sessionId at all
   ```

**Solution:**
```bash
# Check Firebase Functions config
firebase functions:config:get

# Verify publishable key is not null
# Re-deploy functions:
firebase deploy --only functions
```

### Problem: "Payment gateway is not configured"

**Cause:** Missing Firebase Functions config

**Solution:**
```bash
# Set the keys
firebase functions:config:set thawani.secret="YOUR_SECRET"
firebase functions:config:set thawani.publishable="YOUR_PUBLISHABLE"

# Verify
firebase functions:config:get

# Deploy
firebase deploy --only functions
```

### Problem: Payment Amount is Wrong

**Check:**
1. Amount is in baisa (1000 baisa = 1 OMR)
   ```javascript
   ✅ Correct: Math.round(15 * 1000) = 15000 baisa
   ❌ Wrong:   15 (too small, rejected)
   ```

2. Amount is an integer
   ```javascript
   ✅ Correct: Math.round(total * 1000)
   ❌ Wrong:   total * 1000 (may have decimals)
   ```

**Solution:**
```javascript
// Always ensure integer amount in baisa
const amountInBaisa = Math.round(priceInOMR * 1000);
```

### Problem: Session Expires / Gets Rejected

**Default Session Expiry:**
- 30 minutes from creation

**Solution:**
- Keep session timeout < 30 minutes
- Store sessionId for verification after redirect
- Create new session if expired

### Problem: Mock Mode Not Working

**Check:**
1. Is REACT_APP_THAWANI_MOCK_MODE set to true?
2. Are you reading from .env.local?
3. Did you rebuild after changing .env?

**Solution:**
```bash
# Stop dev server
# Add to .env.local:
REACT_APP_THAWANI_MOCK_MODE=true

# Restart dev server
npm start
```

---

## Security Best Practices

### ✅ Do's

- ✅ Store Secret Key ONLY in Firebase Functions config
- ✅ Validate amount server-side
- ✅ Verify user owns session before processing
- ✅ Log payment events for audit trail
- ✅ Use HTTPS for all requests
- ✅ Implement webhook signature verification
- ✅ Rate limit payment endpoints

### ❌ Don'ts

- ❌ Never hardcode API keys
- ❌ Never log API keys (use *** masking)
- ❌ Never expose Secret Key to frontend
- ❌ Never trust client-side amount validation
- ❌ Never skip user authentication
- ❌ Never store payment details
- ❌ Never commit .env files to git

---

## Deployment Checklist

- [ ] Firebase Functions config set with real API keys
- [ ] REACT_APP_THAWANI_MOCK_MODE=false
- [ ] Frontend URLs configured correctly
- [ ] Firestore Payments collection exists
- [ ] Redux store properly initialized
- [ ] Error handling working for all scenarios
- [ ] Logging properly configured
- [ ] Payment success/failure pages ready
- [ ] Email notifications configured
- [ ] Tested with real Thawani UAT credentials

---

## Support & Resources

### Links
- Thawani Documentation: https://thawani.om/
- Thawani UAT Dashboard: https://uatcheckout.thawani.om/
- Firebase Functions Docs: https://firebase.google.com/docs/functions

### Common Questions

**Q: Can I use production Thawani domain?**
A: Not yet - stay with UAT (uatcheckout.thawani.om) during development/testing

**Q: How long are sessions valid?**
A: 30 minutes from creation

**Q: Can customers save payment methods?**
A: Currently handled by Thawani; not in our implementation

**Q: What happens if payment fails?**
A: User is redirected to cancel URL; can retry

---

## Version History

- **v1.0** (April 2026) - Initial production-ready implementation
  - Complete payment flow
  - Mock mode for testing
  - Comprehensive error handling
  - Firestore integration
  - Proper logging and debugging

