# Thawani Payment Integration - Quick Reference

## Status: ✅ PRODUCTION-READY

---

## 1. Payment Flow

```
User presses "Complete Order"
  ↓
Frontend calls createThawaniSession()
  ↓
[Validates: amount, currency, customer, items]
  ↓
Calls Cloud Function via Firebase
  ↓
Cloud Function:
  • Retrieves API key from Firebase config (secure)
  • Validates request body (products, amounts, etc.)
  • Calls Thawani API endpoint
  • Validates response (null/empty/type checks)
  • Extracts and validates session_id
  • Stores in Firestore
  • Returns to frontend
  ↓
Frontend validates response:
  • Check success flag
  • Validate sessionId (not null, string, not empty, min length)
  • Pre-redirect validation (chars, format)
  ↓
Redirect to: https://uatcheckout.thawani.om/pay/{sessionId}
  ↓
User completes payment on Thawani
  ↓
Return to payment-success page
  ↓
Verify payment status
```

---

## 2. Key Files

### Backend
- **`functions/thawani.js`** - Cloud Function for payment processing
  - `createThawaniSession()` - Creates payment session
  - `verifyThawaniPayment()` - Verifies payment status
  - `thawaniWebhook()` - Webhook handler

### Frontend
- **`src/services/thawaniPaymentService.js`** - Payment service
  - `createThawaniSession()` - Calls backend function
  - `redirectToThawaniCheckout()` - Redirects to checkout
  - `verifyThawaniPayment()` - Verifies payment on success page

### UI
- **`src/pages/CheckoutThawani.jsx`** - Checkout page
- **`src/pages/PaymentSuccess.jsx`** - Success page
- **`src/pages/PaymentFailed.jsx`** - Failed payment page

---

## 3. Configuration

### Required Environment Variables

**Firebase Functions** (`firebase.json`):
```bash
firebase functions:config:set thawani.secret="your-api-key-here"
```

**Frontend** (`.env`):
```bash
REACT_APP_THAWANI_CHECKOUT_URL=https://uatcheckout.thawani.om/pay
REACT_APP_THAWANI_MOCK_MODE=false  # Set to true for testing
```

### Test API Key
Use provided Thawani sandbox/test API key

---

## 4. Validation Rules

### Amount
- ✅ Must be integer
- ✅ Must be in baisa (1000 baisa = 1 OMR)
- ✅ Minimum: 100 baisa (0.1 OMR)

### Product Price
- ✅ Must be > 0
- ✅ Converted to baisa: `price * 1000`
- ✅ Result must be integer

### Product Quantity
- ✅ Must be >= 1
- ✅ Must be integer

### Product Name
- ✅ Must be non-empty string
- ✅ Trimmed

### Session ID (returned from Thawani)
- ✅ Must be string (not null/undefined)
- ✅ Cannot be empty
- ✅ Must have minimum length (5+ chars)
- ✅ Can only contain: alphanumeric, underscore, hyphen

---

## 5. Error Codes (HTTP)

| Code | Meaning | Response |
|------|---------|----------|
| 400 | Bad Request | "Invalid payment request: [message]" |
| 401 | Invalid API Key | "Payment gateway rejected API key - contact support" |
| 403 | No Permissions | "API key does not have required permissions" |
| 503 | Service Down | "Payment gateway is temporarily unavailable" |
| Timeout | Connection Timeout | "Payment gateway request timed out" |
| Network | DNS/Connection Error | "Cannot reach payment gateway" |

---

## 6. Logging

### Request Logs (Backend)
```
📤 [THAWANI] ========== COMPLETE REQUEST PAYLOAD ==========
📤 [THAWANI] Endpoint: https://uatcheckout.thawani.om/api/v1/checkout/session
📤 [THAWANI] Method: POST
📤 [THAWANI] Headers: { Content-Type: application/json, thawani-api-key: *** }
📤 [THAWANI] Request Body (full JSON): {...}
📤 [THAWANI] Products Array Details: [...]
```

### Response Logs (Backend)
```
📥 [THAWANI] Response received: { status: 200, hasData: true, hasSessionId: true }
✅ [THAWANI] Session ID validated successfully: { sessionId: "...", length: XX }
✅ [THAWANI] Session created successfully: { sessionId: "...", checkoutUrl: "..." }
```

### Redirect Logs (Frontend)
```
🔗 [REDIRECT] Initiating redirect to Thawani checkout: { sessionId: "...", ... }
✅ [REDIRECT] Redirecting to: { url: "https://uatcheckout.thawani.om/pay/...", ... }
```

### Verification Logs (Frontend)
```
🔍 [VERIFY] Verifying payment for session: abc1234...
✅ [VERIFY] Payment verified successfully: { status: "paid", ... }
```

---

## 7. Testing

### Mock Mode (No API Call)
```bash
# Set in .env
REACT_APP_THAWANI_MOCK_MODE=true

# What happens:
# - Generates fake session ID
# - Simulates payment verification
# - No real charges
# - Useful for UI testing
```

### Real Payment (Live API)
```bash
# Set in .env
REACT_APP_THAWANI_MOCK_MODE=false

# Requirements:
# - Valid Thawani API key configured
# - Cloud Functions deployed
# - Internet connection available
```

### Test Payment Flow

1. **Start test**:
   ```bash
   npm start
   ```

2. **Navigate to checkout**:
   - Add items to cart
   - Click "Continue to Checkout"
   - Fill in payment information

3. **Check logs**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for logs starting with `✅ [THAWANI-SERVICE]`

4. **Verify redirect**:
   - Click "Complete Order"
   - Check URL bar - should show `https://uatcheckout.thawani.om/pay/...`
   - Should NOT be `/404` or empty

5. **Complete payment**:
   - Use Thawani test card if available
   - Return to success page

---

## 8. Debugging Checklist

### Issue: Getting 404
- [ ] Check console logs for `✅ [THAWANI-SERVICE] Session created`
- [ ] Verify sessionId is valid (not empty, starts with valid char)
- [ ] Check Cloud Function logs: `firebase functions:log`
- [ ] Ensure API key is configured: `firebase functions:config:get`

### Issue: API Key Rejected (401)
- [ ] Verify API key in Firebase config is correct
- [ ] Check if API key expired with Thawani
- [ ] Confirm API key has correct permissions

### Issue: Bad Request (400)
- [ ] Check request payload in logs
- [ ] Verify all product amounts are integers
- [ ] Ensure minimum amount is 100 baisa
- [ ] Check product names are non-empty

### Issue: Timeout
- [ ] Check network connectivity
- [ ] Verify Thawani API status
- [ ] Increase timeout in Cloud Function if needed (current: 10s)

### Issue: Service Unavailable (503)
- [ ] Thawani may be under maintenance
- [ ] Retry after a few minutes
- [ ] Check Thawani status page

---

## 9. Security Checklist

- ✅ API key stored in Firebase config (server-side only)
- ✅ API key never exposed in frontend code
- ✅ API key masked in logs (show only last 4 chars)
- ✅ User authentication required for all payments
- ✅ Session ownership verified (user can only access own sessions)
- ✅ All input validated (amounts, names, quantities)
- ✅ No sensitive data exposed in error messages

---

## 10. Production Deployment

### Pre-Deployment Checklist
- [ ] Set `REACT_APP_THAWANI_MOCK_MODE=false` in production
- [ ] Configure real Thawani API key in Firebase
- [ ] Update `FRONTEND_URL` in Cloud Functions config
- [ ] Set payment success/cancel URLs correctly
- [ ] Run `npm run build` - ensure zero warnings
- [ ] Test payment flow in staging environment

### Deployment Steps
```bash
# 1. Update environment variables
firebase functions:config:set \
  thawani.secret="PROD_API_KEY" \
  functions.env="production"

# 2. Deploy
firebase deploy --only functions
npm run build
firebase deploy --only hosting

# 3. Verify
firebase functions:log --tail
```

### Post-Deployment Verification
- [ ] Can create test payment session
- [ ] Redirects to valid Thawani checkout URL
- [ ] Payment verification works
- [ ] Error handling works (try with invalid data)
- [ ] Logs appear in Firebase Console

---

## 11. Common Commands

```bash
# View Cloud Function logs
firebase functions:log --only createThawaniSession

# View all logs (tail)
firebase functions:log --tail

# Check config
firebase functions:config:get

# Set config
firebase functions:config:set thawani.secret="api-key"

# Deploy only functions
firebase deploy --only functions

# Deploy only frontend
firebase deploy --only hosting

# Full deploy
firebase deploy

# Run locally
npm start

# Build for production
npm run build

# Test build
npm run build 2>&1 | grep -i warning
```

---

## 12. Quick Links

- **Thawani Docs**: [https://docs.thawani.om](https://docs.thawani.om)
- **Firebase Docs**: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **React Docs**: [https://react.dev](https://react.dev)
- **Thawani Sandbox**: [https://uatcheckout.thawani.om](https://uatcheckout.thawani.om)

---

## 13. Support

### For API-related issues:
- Contact Thawani support (check API key, permissions, test data)

### For code-related issues:
- Check `THAWANI_VALIDATION_REPORT.md` for detailed validation
- Review console logs with `[THAWANI]` prefix
- Check `firebase functions:log` for backend errors
- Ensure environment variables are set

### For urgent issues:
1. Check error logs
2. Review this quick reference
3. Consult THAWANI_VALIDATION_REPORT.md
4. Contact development team

---

**Last Updated**: April 7, 2026  
**Status**: ✅ Production-Ready  
**Build**: ✅ Passing (Exit Code 0, Zero Warnings)
