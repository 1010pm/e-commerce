# E-Commerce Application - Implementation Guide

**Complete Guide for Production Deployment**

---

## 📋 TABLE OF CONTENTS

1. [Services Overview](#services-overview)
2. [Data Flow](#data-flow)
3. [Authentication Flow](#authentication-flow)
4. [Order Processing](#order-processing)
5. [Deployment Steps](#deployment-steps)
6. [Troubleshooting](#troubleshooting)

---

## 1. SERVICES OVERVIEW

### ordersService.js
**Location**: `src/services/ordersService.js`

**Purpose**: Complete order management with userId-based filtering

**Key Methods**:
```javascript
// Fetch user's orders
const result = await ordersService.getAll(userId);
if (result.success) {
  console.log(result.data); // Array of orders
}

// Get single order (with auth check)
const result = await ordersService.getById(orderId, userId);

// Create new order
const result = await ordersService.create(userId, {
  items: [...],
  shippingAddress: {...},
  paymentMethod: 'card',
  subtotal, tax, shipping, total
});

// Update order status (admin only)
await ordersService.updateStatus(orderId, 'shipped');

// Cancel order (customer can cancel own)
await ordersService.cancel(orderId, userId, 'Reason');
```

### cartService.js
**Location**: `src/services/cartService.js`

**Purpose**: Cart persistence in localStorage and Firestore

**Key Methods**:
```javascript
// Local cart (guest)
const items = cartService.getLocalCart();
cartService.saveLocalCart(items);
cartService.clearLocalCart();

// Firestore cart (authenticated user)
const result = await cartService.getFromFirestore(userId);
await cartService.saveToFirestore(userId, items);

// Merge carts on login
const merged = cartService.mergeCart(guestCart, userCart);
const result = await cartService.syncOnLogin(userId, currentCart);

// Calculate totals
const totals = cartService.calculateTotals(items);
// Returns: { subtotal, tax, shipping, total, itemCount }
```

### checkoutService.js
**Location**: `src/services/checkoutService.js`

**Purpose**: Checkout validation and calculations

**Key Methods**:
```javascript
// Validate address
const validation = checkoutService.validateShippingAddress(address);
if (!validation.valid) console.log(validation.errors);

// Validate payment
const paymentValidation = checkoutService.validatePayment(payment);

// Calculate totals
const totals = checkoutService.calculateTotals(items, {
  taxRate: 0.08,
  shippingCost: 10,
  freeShippingThreshold: 100
});

// Prepare order data
const orderData = checkoutService.prepareOrderData(data, userId);
```

### userService.js
**Location**: `src/services/userService.js`

**Purpose**: User profile management with Firestore sync

**Key Methods**:
```javascript
// Get merged profile (Firebase Auth + Firestore)
const result = await getUserProfile(uid);
// Returns: { uid, displayName, email, phoneNumber, address, ... }

// Update profile
const result = await updateUserProfile(uid, {
  displayName: 'New Name',
  phoneNumber: '+1234567890',
  address: {...}
});

// Initialize profile on registration
await initializeUserProfile(uid, { displayName, email });
```

---

## 2. DATA FLOW

### User Registration Flow
```
User Signs Up
    ↓
Firebase Auth creates user
    ↓
authService.registerUser() called
    ↓
Email verification sent
    ↓
initializeUserProfile(uid) creates Firestore doc
    ↓
User receives profile email
    ↓
✅ Profile created in Firestore users/{uid}
```

### Login Flow
```
User Logs In
    ↓
Firebase Auth authenticates
    ↓
onAuthStateChanged fires
    ↓
authSlice.setUser() updates Redux
    ↓
getUserProfile(uid) fetches Firestore profile
    ↓
cartService.syncOnLogin() merges guest cart
    ↓
✅ User state complete
```

### Order Creation Flow
```
User fills checkout form
    ↓
Validation with checkoutService
    ↓
checkoutService.prepareOrderData() formats order
    ↓
ordersService.create(userId, orderData)
    ↓
Firestore saves order with:
  - userId (for queries)
  - items (with prices)
  - shippingAddress (full)
  - paymentStatus: 'pending'
  - status: 'pending'
    ↓
clearCart() removes items from Redux + localStorage
    ↓
✅ Order saved, user redirected to order details
```

### Order Query Flow
```
User views "My Orders"
    ↓
ordersService.getAll(userId)
    ↓
Firestore queries: where("userId", "==", userId)
    ↓
Results filtered server-side by userId
    ↓
✅ Only user's orders returned
```

---

## 3. AUTHENTICATION FLOW

### Google Sign-In
```
User clicks "Sign in with Google"
    ↓
Google OAuth popup opens
    ↓
Firebase authenticates with Google
    ↓
signInWithPopup() returns user
    ↓
authService.loginWithGoogle()
    ↓
userService.initializeUserProfile() creates profile
    ↓
✅ User logged in with profile saved
```

### Email/Password
```
User signs up with email/password
    ↓
authService.registerUser() creates auth user
    ↓
Email verification sent to inbox
    ↓
User clicks verification link
    ↓
Firebase sets emailVerified = true
    ↓
userService.initializeUserProfile() called
    ↓
ProtectedRoute checks emailVerified
    ↓
✅ User gains access to protected routes
```

### Logout
```
User clicks Logout
    ↓
logoutUser() called
    ↓
Firebase Auth signs out
    ↓
Redux auth state cleared
    ↓
Cart cleared from localStorage
    ↓
Redirected to home
    ↓
✅ Session ended securely
```

---

## 4. ORDER PROCESSING

### Creating an Order
```javascript
// In Checkout page
const orderData = {
  items: [
    { productId, name, price, quantity, image }
  ],
  shippingAddress: {
    firstName, lastName, email, phone,
    addressLine, city, state, zipCode, country
  },
  paymentMethod: 'card', // or 'cash'
  subtotal: 100,
  tax: 8,
  shipping: 10,
  total: 118
};

// ordersService validates and saves
const result = await ordersService.create(userId, orderData);
// Returns: { success, data: { id, ...orderData } }

// Firestore structure:
// orders/{autoId}
//   userId: "user123"
//   items: [...]
//   shippingAddress: {...}
//   paymentMethod: "card"
//   paymentStatus: "pending"
//   status: "pending"
//   subtotal: 100
//   tax: 8
//   shipping: 10
//   total: 118
//   createdAt: <serverTimestamp>
//   updatedAt: <serverTimestamp>
```

### Querying Orders
```javascript
// Get user's orders
const result = await ordersService.getAll(userId);
// Firestore executes:
// query(collection(db, 'orders'),
//   where('userId', '==', userId),
//   orderBy('createdAt', 'desc'))

// Get single order with auth check
const result = await ordersService.getById(orderId, userId);
// Checks: order.userId === userId before returning
```

### Admin Order Management
```javascript
// Update order status (admin only)
await ordersService.updateStatus(orderId, 'shipped');
// Security: Firestore rules check isAdmin()

// Get all orders (admin view)
const result = await ordersService.getAllOrders({
  status: 'pending',
  limit: 50
});
```

---

## 5. DEPLOYMENT STEPS

### Step 1: Build the Application
```bash
npm run build
# Creates optimized build in /build directory
```

### Step 2: Test Production Build Locally
```bash
npm install -g serve
serve -s build
# Visit http://localhost:3000 to test
```

### Step 3: Deploy to Firebase Hosting
```bash
# Login to Firebase
firebase login

# Deploy
firebase deploy

# View your app
firebase open hosting:site
```

### Step 4: Configure Custom Domain (Optional)
1. Go to Firebase Console
2. Hosting → Domain Settings
3. Add custom domain
4. Follow DNS setup instructions

### Step 5: Monitor After Deployment
```bash
# View logs
firebase functions:log

# Check Firestore usage
firebase firestore:inspect
```

---

## 6. TROUBLESHOOTING

### Issue: Orders not saving
**Cause**: userId not set correctly
**Solution**:
```javascript
// Ensure userId is from useAuth hook
const { user } = useAuth(); // ✅ Correct
const { user } = useSelector(state => state.auth); // ❌ May be null

// Always check userId exists
if (!userId) {
  toast.error('Please sign in first');
  return;
}
```

### Issue: Firestore permission denied on orders
**Cause**: Security rules not matching
**Solution**: Check firestore.rules:
```javascript
match /orders/{orderId} {
  // Read: Check both conditions
  allow read: if isAuthenticated() && 
                 (isOwner(resource.data.userId) || isAdmin());
}
```

### Issue: Cart not syncing on login
**Cause**: cartService.syncOnLogin() not called
**Solution**: Add to login thunk:
```javascript
// After user logs in
const merged = await cartService.syncOnLogin(userId, guestCart);
dispatch(setCart(merged));
```

### Issue: Google Sign-In fails
**Cause**: CSP policy blocking APIs
**Solution**: Verify public/index.html has:
```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://apis.google.com https://www.googletagmanager.com;
  frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
  connect-src 'self' https://identitytoolkit.googleapis.com https://*.firebaseapp.com;
">
```

### Issue: Phone number not saving
**Cause**: Validation failing silently
**Solution**: Check validation:
```javascript
const valid = validatePhoneNumber(phone);
// Must be 7-15 digits (international standard)
// +1234567890 ✅
// 1234567 ❌ (too short)
```

### Issue: Checkout validation errors
**Cause**: Address fields missing or wrong format
**Solution**: Debug with:
```javascript
const validation = checkoutService.validateShippingAddress(address);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
  // Check each field requirement
}
```

---

## 📱 TESTING CHECKLIST

### Authentication
- [ ] Google Sign-In works
- [ ] Email/password registration works
- [ ] Email verification sends
- [ ] Login persists on refresh
- [ ] Logout clears session
- [ ] Protected routes redirect

### Profile
- [ ] Profile loads on login
- [ ] Phone number shows/edits
- [ ] Address form validates
- [ ] Save button works
- [ ] Error messages show

### Products
- [ ] Products load
- [ ] Search filters results
- [ ] Categories filter
- [ ] Product details open
- [ ] Add to cart works

### Cart
- [ ] Items add to cart
- [ ] Cart persists on refresh
- [ ] Quantity updates
- [ ] Remove item works
- [ ] Clear cart works

### Checkout
- [ ] Form pre-fills from profile
- [ ] Validation catches errors
- [ ] Calculations correct
- [ ] Order creates successfully
- [ ] Redirect to order details

### Orders
- [ ] Order list shows
- [ ] Order details load
- [ ] Status updates work (admin)
- [ ] Cancel order works
- [ ] Can't see other users' orders

### Security
- [ ] Guest can't access protected routes
- [ ] Can't manually access others' orders
- [ ] Can't modify other profiles
- [ ] Admin checks work

---

## 📞 SUPPORT & MAINTENANCE

### Regular Tasks
- Monitor Firestore usage in Firebase Console
- Check error logs for issues
- Backup Firestore data periodically
- Review and update security rules

### Performance Monitoring
- Use Lighthouse for PWA score
- Monitor Firestore read/write operations
- Check Core Web Vitals in Firebase Console

### Scaling Considerations
- Firestore scales automatically
- Add database indexing if queries slow
- Consider caching for frequent queries
- Implement pagination for large datasets

---

**For questions or issues, refer to Firebase docs: https://firebase.google.com/docs**

**Application Version**: 1.0.0-production  
**Last Updated**: April 3, 2026
