# Payment Integration Guide

**Status**: ✅ Core checkout process working. Ready for payment provider integration.

---

## 🎯 Current State

The application has a complete checkout flow with:
- ✅ Address validation
- ✅ Card validation (Luhn algorithm)
- ✅ Payment method selection
- ✅ Order creation with `paymentStatus: 'pending'`
- ✅ Payment information stored securely

**Next Step**: Integrate payment provider (Stripe or PayPal)

---

## 💳 Payment Provider Options

### Option 1: Stripe (Recommended)
**Pros**: Industry standard, extensive docs, webhooks support, test mode  
**Cons**: 2.9% + $0.30 per transaction  
**Best for**: E-commerce, international

### Option 2: PayPal
**Pros**: Wide customer trust, lower fees  
**Cons**: More complex integration  
**Best for**: Established stores

### Option 3: Square
**Pros**: Simple integration, fair pricing  
**Cons**: Limited international support  
**Best for**: US-focused stores

---

## 📋 Integration Steps (Stripe Example)

### Step 1: Install Dependencies
```bash
npm install @stripe/react-stripe-js @stripe/js
```

### Step 2: Get API Keys
1. Go to [stripe.com](https://stripe.com)
2. Create account and get **Publishable Key** (pk_test_...)
3. Get **Secret Key** (sk_test_...)

### Step 3: Add Environment Variables

Edit `.env.local`:
```bash
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
REACT_APP_STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

⚠️ **NEVER commit secrets to git!** (Already in .gitignore)

### Step 4: Create Stripe Service

Create `src/services/stripeService.js`:
```javascript
import { loadStripe } from '@stripe/js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export const stripeService = {
  getStripe: async () => {
    return stripePromise;
  },

  createPaymentIntent: async (amount, userId) => {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, userId }),
    });
    return response.json();
  },

  processPayment: async (stripe, elements, clientSecret) => {
    return stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { name: 'John Doe' },
      },
    });
  },
};
```

### Step 5: Update Checkout Component

```jsx
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripeService } from '../services/stripeService';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async () => {
    // 1. Create payment intent on backend
    const { clientSecret } = await stripeService.createPaymentIntent(
      total * 100, // Amount in cents
      userId
    );

    // 2. Confirm payment with Stripe
    const { paymentIntent } = await stripeService.processPayment(
      stripe,
      elements,
      clientSecret
    );

    if (paymentIntent.status === 'succeeded') {
      // 3. Create order with successful payment
      await ordersService.create(userId, orderData);
    }
  };

  return (
    <form onSubmit={handlePayment}>
      <CardElement />
      <button>Pay ${total}</button>
    </form>
  );
};

export default function Checkout() {
  const stripe = await stripeService.getStripe();
  
  return (
    <Elements stripe={stripe}>
      <CheckoutForm />
    </Elements>
  );
}
```

---

## 🔐 Backend Integration (Node.js/Firebase)

### Option A: Firebase Cloud Functions

Create `functions/createPaymentIntent.js`:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const functions = require('firebase-functions');

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  const { amount, userId } = data;

  const paymentIntent = await stripe.paymentIntents.create({
    amount, // in cents
    currency: 'usd',
    metadata: { userId },
  });

  return { clientSecret: paymentIntent.client_secret };
});
```

### Option B: External Backend (Node.js)

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, userId } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { userId },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'payment_intent.succeeded') {
    const { userId, orderId } = event.data.object.metadata;
    // Update order status to 'paid'
    updateOrderPaymentStatus(orderId, 'completed');
  }

  res.json({received: true});
});
```

---

## 🧪 Testing with Stripe

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0025 0000 3155
```

All use: Expiry: 12/25, CVC: 123

### Testing Flow
1. Add product to cart
2. Go to checkout
3. Enter test card number
4. Submit order
5. Check Stripe Dashboard for payment intent

---

## 📊 Order Status Flow

```
Guest starts checkout
    ↓
User enters payment info
    ↓
Order created (status: pending, paymentStatus: pending)
    ↓
Payment provider processes
    ↓
Webhook confirms payment
    ↓
Update order: paymentStatus: completed
    ↓
Send confirmation email
    ↓
Order appears in My Orders
```

---

## 💾 Updating Order After Payment

### In Database (Firestore)

```javascript
// Update payment status on webhook
await updateDoc(doc(db, 'orders', orderId), {
  paymentStatus: 'completed',
  paymentIntentId: paymentIntentId,
  updatedAt: serverTimestamp(),
});
```

### Using ordersService

```javascript
// After payment succeeds
await ordersService.updatePaymentStatus(orderId, 'completed');
```

---

## 🔒 Security Checklist

- ✅ **Never expose secret key** - Only use in backend
- ✅ **Use HTTPS** - Required for payment processing
- ✅ **PCI Compliance** - Use Stripe.js, don't handle card data
- ✅ **Validate on server** - Never trust client-side validation
- ✅ **Use webhooks** - Don't rely on client responses
- ✅ **Store securely** - Keep stripe keys in environment variables
- ✅ **Test thoroughly** - Use test mode before going live

---

## 🚀 Production Checklist

- [ ] Stripe account created (production mode)
- [ ] Production API keys added to `.env.local`
- [ ] Backend deployed with payment processing
- [ ] Webhook configured in Stripe Dashboard
- [ ] SSL certificate installed
- [ ] Payment testing complete
- [ ] Error handling for failed payments
- [ ] Refund process documented
- [ ] Customer support email setup
- [ ] Analytics/monitoring configured

---

## 📝 Placeholder Configuration

For **development without payment processing**:

Use this placeholder payment configuration:

```javascript
// src/services/paymentService.js
export const paymentService = {
  // Placeholder: Replace with real Stripe integration
  processPayment: async (paymentData, amount) => {
    console.log('🔄 [DEV] Processing payment:', { paymentData, amount });
    
    // Simulate payment processing (dev only)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: `dev_${Date.now()}`,
          message: '✅ Payment processed (DEV MODE)',
        });
      }, 1000);
    });
  },

  validatePaymentData: (payment) => {
    // Basic validation
    if (!payment.method) return { valid: false, error: 'Payment method required' };
    return { valid: true };
  },
};
```

Usage in Checkout:
```javascript
// Temporary - Replace with real payment processing
const paymentResult = await paymentService.processPayment(payment, total);

if (paymentResult.success) {
  await ordersService.create(userId, {
    ...orderData,
    paymentStatus: 'completed', // Dev only
    transactionId: paymentResult.transactionId,
  });
}
```

---

## 🔗 Useful Links

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Test Cards**: https://stripe.com/docs/testing#cards
- **Firebase Cloud Functions**: https://firebase.google.com/docs/functions
- **PCI Compliance**: https://www.pcicomplianceguide.org/
- **Payment Best Practices**: https://developers.google.com/payments/articles

---

## ❓ FAQ

**Q: Can I use mock payments in development?**  
A: Yes! Use test Stripe cards (4242...) or our placeholder paymentService.

**Q: How do I handle failed payments?**  
A: Check payment status webhook, update order to `paymentStatus: 'failed'`, show user-friendly error.

**Q: Is PCI compliance required?**  
A: Yes, but Stripe handles it if you use their components (CardElement).

**Q: Can I refund orders?**  
A: Yes, via Stripe Dashboard or `stripe.refunds.create()` in backend.

**Q: What about international payments?**  
A: Stripe supports 135+ currencies. Check your Stripe settings.

---

**Version**: 1.0.0  
**Last Updated**: April 3, 2026  
**Next Steps**: Choose payment provider and implement `stripeService.js`
