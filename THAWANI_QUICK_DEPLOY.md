# Thawani Payment Integration - Quick Reference & Deployment

## 🚀 Quick Deploy Checklist

### Step 1: Set Firebase Functions Configuration

```bash
# Navigate to project directory
cd c:\Users\user\Desktop\projects\e-commerce\e-commerce

# Set Thawani API keys
firebase functions:config:set thawani.secret="YOUR_THAWANI_SECRET_KEY"
firebase functions:config:set thawani.publishable="YOUR_THAWANI_PUBLISHABLE_KEY"

# Verify configuration is set correctly
firebase functions:config:get

# Output should show:
# {
#   "thawani": {
#     "secret": "sk_uat...",
#     "publishable": "pk_uat..."
#   }
# }
```

### Step 2: Deploy Firebase Functions

```bash
# Deploy only functions (faster)
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

### Step 3: Configure Environment Variables

**Frontend Configuration (.env.local):**
```env
# Payment Gateway
REACT_APP_THAWANI_CHECKOUT_URL=https://uatcheckout.thawani.om/pay
REACT_APP_THAWANI_MOCK_MODE=false

# Existing configs...
```

### Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Clear cache and restart
npm start
```

### Step 5: Test Payment Flow

1. **Test Session Creation**
   - Add items to cart
   - Go to checkout
   - Fill form
   - Click "Pay with Thawani"
   - Should redirect to Thawani checkout page

2. **Verify Redirect URL Format**
   - Browser should go to: `https://uatcheckout.thawani.om/pay/{sessionId}?key={publishableKey}`
   - NOT just: `https://uatcheckout.thawani.om/pay/{sessionId}`

3. **Complete Test Payment**
   - Use test card from Thawani
   - Complete payment
   - Should redirect back to success page

---

## 🔍 Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ User Browser                                                     │
│                                                                  │
│  1. Fill checkout form                                           │
│  2. Click "Pay with Thawani" button                             │
│  3. Form validated locally                                       │
│                                                                  │
│  ↓                                                               │
│                                                                  │
│  5. Redirect to Thawani:                                        │
│     https://uatcheckout.thawani.om/pay/{sessionId}?key={key}   │
│                                                                  │
│  9. User completes payment on Thawani                           │
│                                                                  │
│  11. Thawani redirects back to success_url                      │
│  12. Display order confirmation                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    (HTTPS Calls)
┌─────────────────────────────────────────────────────────────────┐
│ React Frontend Service (thawaniPaymentService.js)              │
│                                                                  │
│  4. Call createThawaniSession() with:                           │
│     - amount (integer in baisa)                                 │
│     - currency ('OMR')                                          │
│     - customer data                                             │
│     - items array                                               │
│                                                                  │
│  7. Receive response:                                           │
│     {                                                            │
│       success: true,                                            │
│       sessionId: \"...\",                                         │
│       sessionUrl: \"https://...?key=...\"                        │
│     }                                                            │
│                                                                  │
│  8. Call redirectToThawaniCheckout(sessionUrl)                 │
│     - Validates URL format                                      │
│     - Checks for publishable key                               │
│     - Redirects: window.location.href                          │
│                                                                  │
│  10. Verify payment after return                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    (Callable Function)
┌─────────────────────────────────────────────────────────────────┐
│ Firebase Cloud Functions (functions/thawani.js)                │
│                                                                  │
│  createThawaniSession():                                        │
│                                                                  │
│  • Verify user is authenticated                                 │
│  • Validate all input parameters                                │
│  • Generate client_reference_id                                 │
│  • Convert prices: OMR → baisa (×1000)                         │
│  • Get API keys from config:                                    │
│    - Secret Key (for API auth)                                  │
│    - Publishable Key (for redirect URL)                        │
│                                                                  │
│  • Prepare request payload:                                     │
│    {                                                            │
│      client_reference_id: \"order...\",                         │
│      mode: \"payment\",                                         │
│      products: [{name, quantity, unit_amount}],                │
│      success_url: \"https://...\",                             │
│      cancel_url: \"https://...\"                               │
│    }                                                            │
│                                                                  │
│  • POST to Thawani API:                                         │
│    POST https://uatcheckout.thawani.om/api/v1/checkout/session│
│    Header: thawani-api-key: {secret_key}                       │
│    Body: {payload}                                              │
│                                                                  │
│  • Handle response:                                             │
│    - Extract session_id from response                           │
│    - Build sessionUrl with publishable key                      │
│    - Store session in Firestore                                 │
│    - Return to frontend                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                        (HTTPS POST)
┌─────────────────────────────────────────────────────────────────┐
│ Thawani Payment Gateway (UAT)                                   │
│                                                                  │
│ API Endpoint: https://uatcheckout.thawani.om/api/v1            │
│                                                                  │
│ • Receives session creation request                             │
│ • Validates request data                                        │
│ • Creates session                                               │
│ • Returns session_id                                            │
│                                                                  │
│ Checkout URL: https://uatcheckout.thawani.om/pay/{sessionId}  │
│                                                                  │
│ • User submits payment details                                  │
│ • Thawani processes payment                                     │
│ • Redirects to success_url or cancel_url                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Key Code Snippets

### Backend Response Format

```javascript
// From: functions/thawani.js
return {
  success: true,
  sessionId: "session_eG9xN3p2Y0w4VrSa",           // From Thawani API
  sessionUrl: "https://uatcheckout.thawani.om/pay/session_eG9xN3p2Y0w4VrSa?key=pk_uatXXXXXXXXXX"
};
```

### Frontend Session Creation Call

```javascript
// From: src/pages/CheckoutThawani.jsx
const sessionResponse = await createThawaniSession({
  amount: totalInBaisa,        // Integer in baisa (1000 = 1 OMR)
  currency: 'OMR',
  customer: {
    name: `${firstName} ${lastName}`,
    email: userEmail,
    phone: userPhone
  },
  items: [
    { name: 'Product Name', quantity: 1, price: 15.5 }
  ]
});
```

### Frontend Redirect

```javascript
// From: src/services/thawaniPaymentService.js
// Input: sessionUrl with ?key parameter (from backend)
redirectToThawaniCheckout(sessionResponse.sessionUrl);

// Validates:
// ✅ URL format valid
// ✅ Contains uatcheckout.thawani.om domain
// ✅ Contains key= parameter
// Then redirects:
window.location.href = sessionUrl;
```

---

## 🧪 Testing Without Real Payments (Mock Mode)

### Enable Mock Mode

```env
# .env.local
REACT_APP_THAWANI_MOCK_MODE=true
```

**What happens:**
- All session create calls return mock session immediately
- No API calls to Thawani
- Payments auto-approved
- Perfect for UI/UX testing

### Test Scenarios

```javascript
// Mock returns
{
  success: true,
  sessionId: "mock_session_1234567890",
  sessionUrl: "https://...",
  isMock: true
}
```

---

## ❌ Common Issues & Fixes

### Issue 1: 404 When Redirect to Thawani

**Symptom:** Browser shows 404 on Thawani payment page

**Cause:** Missing publishable key in URL

**Check:**
```
✅ Correct: https://uatcheckout.thawani.om/pay/abc123?key=pk_uat...
❌ Wrong:   https://uatcheckout.thawani.om/pay/abc123
```

**Fix:**
```bash
# Verify Firebase config
firebase functions:config:get

# Should show both keys:
# "secret": "sk_uat...",
# "publishable": "pk_uat..."

# If missing:
firebase functions:config:set thawani.publishable="YOUR_KEY"
firebase deploy --only functions
```

### Issue 2: "Payment gateway is not configured"

**Cause:** Missing API keys in Firebase config

**Fix:**
```bash
firebase functions:config:set thawani.secret="YOUR_SECRET_KEY"
firebase functions:config:set thawani.publishable="YOUR_PUBLISHABLE_KEY"
firebase deploy --only functions
```

### Issue 3: Wrong Amount Showing

**Cause:** Amount calculation error (not converting to baisa correctly)

**Fix:**
```javascript
// ✅ Correct
const amountInBaisa = Math.round(priceInOMR * 1000);
// Result: 15 OMR → 15000 baisa

// ❌ Wrong
const amountInBaisa = priceInOMR * 1000;
// Result: may have decimals: 15000.0000001
```

### Issue 4: "Session ID is invalid"

**Cause:** sessionId is malformed or truncated

**Check Frontend Console:**
```javascript
// Should see:
✅ [REDIRECT] Valid session URL, redirecting to: https://...

// Or error:
❌ [REDIRECT] Session URL missing required key parameter
```

**Fix:**
```bash
# Check functions logs
firebase functions:log --only=createThawaniSession

# Verify response includes full sessionId and key
```

---

## 🔐 Security Checklist

- [ ] Secret key NEVER hardcoded in frontend
- [ ] Secret key NEVER logged to console
- [ ] Secret key NEVER visible in error messages
- [ ] Publishable key used ONLY in redirect URL
- [ ] User authentication required before payment
- [ ] Server-side validation of all input
- [ ] Session ownership verified in Firestore
- [ ] Rate limiting on payment endpoints
- [ ] HTTPS enforced for all requests
- [ ] Error messages don't expose internal details

---

## 📊 Files Modified

| File | Changes | Impact |
|------|---------|--------|
| `functions/thawani.js` | Added publishable key retrieval & URL construction | ✅ Fixes 404 redirect issue |
| `src/services/thawaniPaymentService.js` | Updated redirectToThawaniCheckout to accept sessionUrl | ✅ Enables proper URL validation |
| `src/pages/CheckoutThawani.jsx` | Pass sessionUrl to redirect function, better UX | ✅ Improves user experience |
| `THAWANI_PAYMENT_SETUP.md` | Complete setup documentation | ✅ Easier deployment |
| `THAWANI_FIXES_APPLIED.md` | Detailed fix explanations | ✅ Clear change tracking |

---

## ✅ Verification Steps

After deployment:

```bash
# 1. Check Firebase config deployed correctly
firebase functions:config:get

# 2. Check functions deployed
firebase deploy --only functions

# 3. Watch logs in real time
firebase functions:log --follow

# 4. Test in browser:
# - Add items to cart
# - Checkout
# - Click Pay
# - Should redirect to: https://uatcheckout.thawani.om/pay/{id}?key={key}

# 5. Check successful redirect
# - User should see Thawani payment form
# - No 404 error
# - Can enter test payment details
```

---

## 📞 Support

If you encounter issues:

1. **Check logs first**
   ```bash
   firebase functions:log --only=createThawaniSession
   ```

2. **Verify configuration**
   ```bash
   firebase functions:config:get
   ```

3. **Test with sample data**
   - Use provided test card numbers
   - Verify amount is integer in baisa
   - Confirm customer data complete

4. **Check browser console**
   - Look for `[THAWANI]`, `[CHECKOUT]`, `[REDIRECT]` logs
   - Check for `❌` error markers

