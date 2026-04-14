# Firebase Cloud Functions

Production Cloud Functions for the e-commerce application.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Set Environment Variables

For **local development**, create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Stripe API keys:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 3. Build TypeScript

```bash
npm run build
```

Or watch for changes:
```bash
npm run watch
```

### 4. Deploy to Firebase

**Deploy just functions:**
```bash
firebase deploy --only functions
```

**Deploy all (includes hosting, firestore, functions):**
```bash
firebase deploy
```

## Environment Variables

Set production environment variables via Firebase CLI:

```bash
# Stripe
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# PayPal (optional)
firebase functions:config:set paypal.client_id="..."
firebase functions:config:set paypal.secret="..."
```

View current configuration:
```bash
firebase functions:config:get
```

## Functions

### `createPaymentIntent`
Creates a Stripe payment intent for checkout.

**Called from:** React component during checkout
**Input:** { amount, currency, metadata }
**Output:** { clientSecret, intentId, status }

### `confirmPayment`
Confirms a payment with Stripe.

**Called from:** React component after payment method processing
**Input:** { clientSecret, paymentMethodId }
**Output:** { status, transactionId }

### `stripeWebhook`
Handles Stripe webhook events.

**Webhook URL:** `https://your-region-project-id.cloudfunctions.net/stripeWebhook`
**Events:** payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

### `health`
Simple health check endpoint.

**URL:** `https://your-region-project-id.cloudfunctions.net/health`

## Testing Locally

Use Firebase emulator:

```bash
firebase emulators:start --only functions
```

## Logs

View function logs:

```bash
firebase functions:log
```

Or view in Firebase Console → Functions → Logs

## Troubleshooting

### Functions not deploying
- Ensure TypeScript compiles: `npm run build`
- Check `firebase.json` includes functions config
- Verify Node.js version: `node --version` (should be 20+)

### Environment variables not set
```bash
firebase functions:config:get stripe
```

### Payment intent creation fails
- Verify STRIPE_SECRET_KEY is set correctly
- Check function logs in Firebase Console
- Test with Stripe test API keys first

### Webhook events not received
- Verify webhook URL in Stripe dashboard
- Check webhook secret is correct
- View webhook logs in Stripe dashboard

## Production Checklist

Before deploying to production:

- [ ] All environment variables set (use `firebase functions:config:get`)
- [ ] Use production Stripe API keys (not test keys)
- [ ] Stripe webhook configured in dashboard
- [ ] Functions deployed and tested
- [ ] Error handling and logging working
- [ ] Monitor function logs during first transactions

## Files

- `src/index.ts` - Main function implementations
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies
- `.env.example` - Environment variable template
- `.gitignore` - Files to exclude from version control

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Cloud Functions TypeScript Guide](https://firebase.google.com/docs/functions/typescript)
