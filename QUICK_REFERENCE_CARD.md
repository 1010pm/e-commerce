# 📌 Google Sign-In - Quick Reference Card

## 🎯 Quick Commands

### Add Google Sign-In Button to Login Page
```jsx
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

<GoogleSignInButton 
  variant="primary" 
  size="md" 
  fullWidth 
/>
```

### Protect a Page
```jsx
import { useAuth } from '../hooks/useAuth';

function MyPage() {
  const { requireAuth } = useAuth();
  if (!requireAuth('/login')) return null;
  // Protected content here
}
```

### Access User Data
```jsx
const { userData, isAuthenticated, isAdmin } = useAuth();

<h1>Welcome, {userData.displayName}</h1>
<img src={userData.photoURL} alt="" />
```

### Get User's Orders
```jsx
const { userData } = useAuth();
const result = await ordersService.getAll(userData.uid);
```

### Create Order with UserId
```javascript
const orderData = {
  userId: user.uid,  // ← ALWAYS include
  items: cartItems,
  totalAmount: 1500,
};
const result = await ordersService.create(orderData);
```

### Sign Out
```jsx
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const dispatch = useDispatch();
await dispatch(logout());
```

---

## 📖 Which File Should I Read?

```
I want to...                                  Read this...
─────────────────────────────────────────────────────────
Get up and running fast                      QUICK_START_GOOGLE_SIGNIN.md
Understand the complete system               GOOGLE_SIGNIN_README.md
Deep dive into implementation                GOOGLE_SIGNIN_IMPLEMENTATION.md
Look up an API method                        GOOGLE_AUTH_API_REFERENCE.md
Copy a working login page                    COMPLETE_LOGIN_EXAMPLE.jsx
Copy a working profile page                  COMPLETE_PROFILE_EXAMPLE.jsx
Copy a working orders page                   COMPLETE_ORDERS_EXAMPLE.jsx
See what I got                               DELIVERY_SUMMARY.md
Navigate all documentation                   GOOGLE_SIGNIN_START_HERE.md
Visual overview                              VISUAL_SUMMARY.md
Troubleshoot an error                        GOOGLE_SIGNIN_IMPLEMENTATION.md
```

---

## 🔑 Key Concepts

### useAuth Hook
Access auth state in any component:
```jsx
const { 
  user,              // Firebase user
  userData,          // Firestore user data
  isAuthenticated,   // bool
  isAdmin,          // bool
  loading,          // bool
  requireAuth       // function
} = useAuth();
```

### googleAuthService
Standalone auth operations:
```javascript
await googleAuthService.signInWithGoogle()
await googleAuthService.signOut()
googleAuthService.getCurrentUser()
googleAuthService.getIdToken()
await googleAuthService.getUserData(uid)
await googleAuthService.updateUserData(uid, data)
```

### Redux Auth State
```javascript
state.auth = {
  user,           // Firebase user object
  userData,       // Firestore user doc
  isAuthenticated,
  isAdmin,
  loading,
  error
}
```

---

## ⚠️ Critical Rules

```
1. ALWAYS include userId when creating orders
   ✅ { userId: user.uid, items, totalAmount }
   ❌ { items, totalAmount }

2. Use ordersService.getAll(userId) for user orders
   ✅ ordersService.getAll(user.uid)
   ❌ ordersService.getAll()

3. Call useAuth() in App component for session persistence
   ✅ function App() { useAuth(); return <Routes /> }
   ❌ function App() { return <Routes /> }

4. Use Redux state from useAuth, not localStorage
   ✅ const { isAuthenticated } = useAuth()
   ❌ localStorage.getItem('authToken')

5. Check account disabled status
   ✅ if (!userData?.isActive) block access
   ❌ Assume user is always active
```

---

## 🚀 5-Minute Setup

### Step 1: Add Button (30 seconds)
```jsx
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

function LoginPage() {
  return <GoogleSignInButton variant="primary" size="md" fullWidth />;
}
```

### Step 2: Protect Routes (1 minute)
```jsx
function ProtectedPage() {
  const { requireAuth } = useAuth();
  if (!requireAuth('/login')) return null;
  return <div>Protected content</div>;
}
```

### Step 3: Get User Orders (1 minute)
```jsx
function OrdersPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    if (!userData?.uid) return;
    ordersService.getAll(userData.uid).then(r => {
      if (r.success) setOrders(r.data);
    });
  }, [userData?.uid]);
  
  return orders.map(order => <div key={order.id}>{order.id}</div>);
}
```

### Step 4: Create Orders with UserId (1 minute)
```jsx
const result = await ordersService.create({
  userId: user.uid,  // ← CRITICAL
  items: cartItems,
  totalAmount: 1500
});
```

### Step 5: Test (1-2 minutes)
- Sign in with Google
- Check user displays
- Check orders filtered
- Sign out
- Done! ✅

---

## 📊 Component Locations

```
src/
├── services/
│   ├── google-auth.js ✨ NEW
│   │   └─ GoogleAuthService
│   └── auth.js (existing)
│       └─ loginWithGoogle()
│
├── components/auth/
│   └── GoogleSignInButton.jsx ✨ NEW
│       └─ Reusable button
│
├── hooks/
│   └── useAuth.js (existing)
│       └─ useAuth() custom hook
│
├── store/slices/
│   └── authSlice.js (existing)
│       └─ googleLogin thunk
│
└── config/
    └── firebase.config.js (existing)
        └─ Firebase init
```

---

## 🔄 Authentication Flow (Simple)

```
User clicks "Continue with Google"
         ↓
GoogleSignInButton dispatches googleLogin()
         ↓
Redux calls loginWithGoogle() service
         ↓
Firebase shows Google OAuth popup
         ↓
User authorizes
         ↓
Service creates/updates Firestore user doc
         ↓
Redux updates auth state
         ↓
Component detects isAuthenticated = true
         ↓
Redirect to home
         ↓
useAuth() provides user data to all components
```

---

## 🐛 Common Errors & Fixes

```
Error: "OAuth redirect URI mismatch"
Fix: Add domain to Firebase authorized origins

Error: Google popup doesn't open
Fix: Check browser popup blocker
     Add domain to authorized origins

Error: User data not loading
Fix: Check Firestore user document exists
     Check Firestore security rules

Error: Orders not filtered
Fix: Make sure userId is stored with order
     Use ordersService.getAll(user.uid)

Error: Session lost on refresh
Fix: Ensure useAuth() called in App component
     Check auth listener initialized

Error: Account disabled error
Fix: Check Firestore user.isActive = true
     Contact admin if disabled
```

---

## ✅ Testing Checklist

- [ ] Google sign-in button visible on login
- [ ] Clicking button opens Google popup
- [ ] After auth, user is logged in
- [ ] User data displays correctly
- [ ] Session persists on refresh
- [ ] Protected routes redirect to login
- [ ] User profile page works
- [ ] Orders show user's orders only
- [ ] Logout clears auth state
- [ ] Admin users see admin dashboard
- [ ] Disabled accounts show error
- [ ] No console errors

---

## 🎯 Success Indicators

✅ Users can sign in with Google  
✅ Profile photo displays  
✅ Email shows correctly  
✅ Session persists  
✅ Protected routes work  
✅ Orders filtered by user  
✅ Sign out works  
✅ No errors in console  

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Confused | Read QUICK_START_GOOGLE_SIGNIN.md |
| Need code | Copy COMPLETE_*_EXAMPLE.jsx |
| Need API | Check GOOGLE_AUTH_API_REFERENCE.md |
| Have error | Search GOOGLE_SIGNIN_IMPLEMENTATION.md |
| Want examples | See COMPLETE_LOGIN_EXAMPLE.jsx |
| Need overview | Read GOOGLE_SIGNIN_README.md |

---

## 💾 File Sizes

```
google-auth.js              ~250 lines
GoogleSignInButton.jsx      ~200 lines
────────────────────────────────────
Total new code             ~450 lines

Documentation              ~5,000 lines
Examples                   ~400 lines
────────────────────────────────────
Total documentation        ~5,400 lines
```

---

## ⏱️ Implementation Time

```
Reading guides:            15-30 minutes
Integration:               20-30 minutes
Testing:                   15-30 minutes
Deployment:                30-60 minutes
─────────────────────────────────────
TOTAL:                     1.5-2.5 hours
```

---

## 🎁 What You Have

✅ 2 new production-ready components  
✅ 8 comprehensive guides  
✅ 3 working example pages  
✅ Complete API reference  
✅ Troubleshooting guide  
✅ Deployment guide  
✅ 5 existing files ready to use  
✅ Zero additional dependencies  

---

## 🚀 Next Steps

1. **Pick your path:**
   - Fast? → QUICK_START_GOOGLE_SIGNIN.md
   - Thorough? → GOOGLE_SIGNIN_README.md
   - Examples? → COMPLETE_*_EXAMPLE.jsx

2. **Integrate:**
   - Add button to login
   - Use useAuth() in components
   - Add userId to orders

3. **Test:**
   - Sign in with Google
   - Check all features work

4. **Deploy:**
   - Follow deployment guide
   - Monitor for errors

---

**Start here:** GOOGLE_SIGNIN_START_HERE.md  
**Get help:** Check the table above  
**Copy code:** Look in COMPLETE_*_EXAMPLE.jsx  
**Look up API:** Check GOOGLE_AUTH_API_REFERENCE.md

---

**You're all set! 🎉**
