# Testing & Validation Guide

**Status**: ✅ Application running and ready for testing  
**Server**: Running on http://localhost:3001  

---

## ✅ Quick Test Checklist

### 1. Authentication
- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] Sign in with Google works
- [ ] Logout clears user session
- [ ] Protected pages redirect to login

### 2. User Profile
- [ ] Profile page loads with user data
- [ ] Can update name
- [ ] Can add/update phone number
- [ ] Can add/update address
- [ ] Changes save to Firestore

### 3. Products & Shopping
- [ ] Product list loads
- [ ] Search works (filters by name)
- [ ] Category filter works
- [ ] Pagination works (next/prev)
- [ ] Product details page opens
- [ ] Can view images

### 4. Cart
- [ ] Add to cart works
- [ ] Cart persists across refresh (localStorage)
- [ ] Can update quantities
- [ ] Can remove items
- [ ] Cart totals calculate correctly
- [ ] Cart syncs on login (guest → user)

### 5. Checkout ⭐ (MAIN TEST)
- [ ] Checkout page loads with user data
- [ ] Address pre-fills from profile
- [ ] All address fields validate
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Order submit creates order in Firestore
- [ ] Redirects to order details
- [ ] Order appears in "My Orders"

### 6. Orders
- [ ] My Orders page shows user's orders only
- [ ] Order details page displays correctly
- [ ] Status badge shows correct color
- [ ] Payment status displays
- [ ] Can cancel pending orders
- [ ] Cannot see other users' orders

### 7. Security
- [ ] Logged out users can't access protected pages
- [ ] Users can only see their own orders
- [ ] Users can only edit their own profile
- [ ] Admin features require admin role

---

## 🧪 Manual Testing Steps

### Test 1: Complete Order Flow (5 mins)

```
1. Open http://localhost:3001
2. Create account (any email/password)
3. Go to Products
4. Click any product → Add to Cart
5. Go to Cart → Checkout
6. Fill address form (should pre-fill from profile):
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +14155552671
   - Address: 123 Main Street
   - City: San Francisco
   - Country: United States
   - Zip: 94103
7. Select payment method: Credit Card
8. Enter card details:
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVC: 123
9. Click "Place Order"
10. Verify redirect to order details page
11. Verify order shows in "My Orders"
```

**Expected Result**: ✅ Order created with status "pending"

---

### Test 2: Cart Sync (3 mins)

```
1. Open http://localhost:3001 (logged out)
2. Add 2 products to cart
3. Log in with account
4. Verify cart items still there
5. Verify quantities preserved
6. Go to Firestore → carts collection
7. Verify your cart document exists
```

**Expected Result**: ✅ Cart synced from localStorage to Firestore

---

### Test 3: Address Validation (2 mins)

```
1. Go to Checkout
2. Leave First Name blank → Click submit
3. Verify error: "First name is required"
4. Enter: "J" (too short)
5. Verify error: "must be at least 2 characters"
6. Try email: "notanemail" → Verify error
7. Try phone: "123" (too short) → Verify error
8. Try zip: "invalid@#" → Verify error
```

**Expected Result**: ✅ All validations work

---

### Test 4: Card Validation (2 mins)

```
1. Go to Checkout
2. Select "Credit Card"
3. Try card: "1111 1111 1111 1111"
4. Verify error: "Invalid card number"
5. Try expiry: "99/99" (future)
6. Verify accepts 12/25 format
7. Try CVC: "12" (too short)
8. Verify error and accepts "123" or "1234"
```

**Expected Result**: ✅ Luhn algorithm validates cards

---

### Test 5: Security - Order Isolation (3 mins)

```
1. Sign in as User A
2. Create order (note the orderId from URL)
3. Log out
4. Sign in as User B
5. Try to access orderId from User A in URL:
   http://localhost:3001/orders/ORDER_ID_HERE
6. Verify access denied or order not shown
7. Go to My Orders
8. Verify only User B's orders show
```

**Expected Result**: ✅ Users can't see others' orders

---

### Test 6: Profile Auto-Fill (2 mins)

```
1. Log in
2. Go to Profile
3. Update: Name, Phone, Address
4. Save changes
5. Go to Checkout
6. Verify all fields pre-filled with saved data
```

**Expected Result**: ✅ Checkout form auto-fills from profile

---

## 🔍 Browser Console Checks

Open DevTools (F12) → Console:

```javascript
// Check if checkoutService is available
console.log(window.checkoutService); // Should NOT be undefined

// Check Firebase auth state
firebase.auth().currentUser; // Should show logged in user

// Check Firestore data
db.collection('orders').where('userId', '==', userId).get()
  .then(snap => console.log(snap.docs.map(d => d.data())));

// Check localStorage cart
console.log(JSON.parse(localStorage.getItem('ecommerce_cart')));
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot read properties of undefined (reading 'validateEmail')"
**Status**: ✅ FIXED in checkoutService.js  
**Cause**: Arrow functions in object don't have proper `this` context  
**Solution**: Converted to regular functions

### Issue: Cart not syncing on login
**Fix**: 
```javascript
// Add to useAuth hook or login component
if (user) {
  const merged = await cartService.syncOnLogin(user.uid, localCart);
  dispatch(setCart(merged));
}
```

### Issue: Orders showing all users' orders
**Fix**:
```javascript
// ordersService MUST filter by userId
const q = query(
  collection(db, 'orders'),
  where('userId', '==', userId) // CRITICAL!
);
```

### Issue: Address fields not validating
**Cause**: Missing character length checks  
**Solution**: checkoutService validates:
- firstName: 2+ chars
- city: 2-50 chars
- addressLine: 5-100 chars
- zipCode: 3-20 chars

### Issue: Payment always succeeds in dev
**Info**: This is intentional! Use placeholder `paymentService` for development  
**Integration**: Replace with real Stripe when ready

---

## 📊 Test Results Template

Use this template to track your testing:

```markdown
## Test Date: [DATE]

### Core Features
- Authentication: ✅ / ❌ / ⏳
- Products: ✅ / ❌ / ⏳
- Cart: ✅ / ❌ / ⏳
- Checkout: ✅ / ❌ / ⏳
- Orders: ✅ / ❌ / ⏳
- Profile: ✅ / ❌ / ⏳

### Security Tests
- Order isolation: ✅ / ❌ / ⏳
- Profile isolation: ✅ / ❌ / ⏳
- Protected routes: ✅ / ❌ / ⏳

### Issues Found
1. [Description] - Severity: [High/Medium/Low]
2. ...

### Notes
[Any observations or blockers]
```

---

## 🚀 Validation Endpoints

### Check User Is Logged In
```javascript
const { user } = useAuth();
if (!user) {
  navigate(ROUTES.LOGIN);
}
```

### Check Order Belongs to User
```javascript
const { user } = useAuth();
const result = await ordersService.getById(orderId, user.uid);
if (result.success) {
  // Order belongs to this user
}
```

### Check User Permissions
```javascript
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
if (!isAdmin) {
  // Show admin-only features
}
```

---

## 📈 Performance Testing

### Measure Page Load Time
```javascript
performance.measure('pageLoad', 'navigationStart', 'loadEventEnd');
const measure = performance.getEntriesByName('pageLoad')[0];
console.log(`Page loaded in ${measure.duration}ms`);
```

### Check Firestore Query Efficiency
- Go to Firebase Console
- Check "Database" → "Statistics"
- Monitor reads/writes per operation

### Expected Performance
- Products page load: < 1 second
- Checkout validation: < 100ms
- Order creation: < 2 seconds (with payment)
- Cart sync on login: < 500ms

---

## ✨ Final Validation Checklist

Before considering production-ready:

- [ ] All 7 feature categories pass tests
- [ ] No console errors (warnings OK)
- [ ] Users can't access other users' orders
- [ ] All validation messages display correctly
- [ ] Cart persists across sessions
- [ ] Address pre-fills on checkout
- [ ] Payment placeholder works
- [ ] Responsive design works on mobile
- [ ] Images load correctly
- [ ] All navigation links work
- [ ] Error handling shows user-friendly messages
- [ ] Performance acceptable
- [ ] No security vulnerabilities found

---

## 📞 Testing Support

If tests fail:
1. Check browser console for errors (F12)
2. Check Firebase Console for data
3. Review error messages carefully
4. Check service imports are correct
5. Verify environment variables set

---

**Version**: 1.0.0  
**Status**: ✅ Ready for testing  
**Server**: http://localhost:3001
