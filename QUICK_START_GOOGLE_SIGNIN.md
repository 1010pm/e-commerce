# 🚀 Google Sign-In Quick Start Guide

Get up and running with Google Authentication in 5 minutes!

## Step 1: Add Google Sign-In Button to Your Login Page

```jsx
// src/pages/auth/Login.jsx
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export default function Login() {
  return (
    <div className="login-container">
      <h1>Sign In</h1>
      
      {/* Add this line */}
      <GoogleSignInButton variant="primary" size="md" fullWidth />
      
      {/* Your existing email login form */}
    </div>
  );
}
```

## Step 2: Protect Your Routes

```jsx
// src/pages/Profile.jsx
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { userData, isAuthenticated, requireAuth } = useAuth();

  // Redirect to login if not authenticated
  if (!requireAuth('/login')) return null;

  return (
    <div>
      <h1>Welcome, {userData.displayName}</h1>
      <img src={userData.photoURL} alt="Profile" />
    </div>
  );
}
```

## Step 3: Access User Data Anywhere

```jsx
// Any component
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { userData, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <LoginLink />;

  return (
    <header>
      <img src={userData.photoURL} alt="" className="w-10 h-10 rounded-full" />
      <span>{userData.displayName}</span>
    </header>
  );
}
```

## Step 4: Fetch User's Orders

```jsx
// src/pages/Orders.jsx
import { useAuth } from '../hooks/useAuth';
import { ordersService } from '../services/firestore';

export default function Orders() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!userData?.uid) return;

    // Get ONLY this user's orders
    ordersService.getAll(userData.uid).then(result => {
      if (result.success) setOrders(result.data);
    });
  }, [userData?.uid]);

  return (
    <div>
      <h1>My Orders ({orders.length})</h1>
      {orders.map(order => (
        <div key={order.id}>Order #{order.id}</div>
      ))}
    </div>
  );
}
```

## Step 5: Create Orders with UserId

```jsx
// When user checks out
const orderData = {
  userId: user.uid,  // ← ALWAYS include this!
  items: cartItems,
  totalAmount: 1500,
  status: 'pending',
};

const result = await ordersService.create(orderData);
```

## ✅ That's It!

Your Google Sign-In authentication system is now working:

- ✅ Users can sign in with Google
- ✅ User profile data is saved in Firestore
- ✅ Session persists on refresh
- ✅ Protected routes work
- ✅ Orders are filtered by user ID
- ✅ Everything is production-ready

## 🎯 Key Points

| Feature | How It Works |
|---------|-------------|
| **Sign In** | User clicks button → Google OAuth → Auto-create Firestore document |
| **Session** | Firebase persists automatically → useAuth restores on refresh |
| **User Data** | Access via `useAuth()` hook in any component |
| **Orders** | Always pass `userId: user.uid` when creating → Query with `ordersService.getAll(user.uid)` |
| **Logout** | Clear Redux state, redirect to login |

## 🔍 What Happens Behind the Scenes

```javascript
// Step by step:
1. User clicks "Continue with Google"
2. GoogleSignInButton dispatches googleLogin() thunk
3. Redux calls loginWithGoogle() service
4. Firebase shows OAuth popup
5. User clicks "Allow"
6. Firebase returns signed-in user
7. Service checks if user exists in Firestore
   - NEW: Creates document with uid, name, email, photo
   - EXISTING: Updates last login
8. Redux updates user state
9. Component detects isAuthenticated = true
10. User redirected to home page
11. On page refresh: useAuth hook restores session automatically
```

## 📦 New Files

- `src/services/google-auth.js` - Google OAuth service
- `src/components/auth/GoogleSignInButton.jsx` - Sign-in button component

## 📚 Full Documentation

See `GOOGLE_SIGNIN_IMPLEMENTATION.md` for:
- Complete implementation details
- All API documentation
- Firestore structure
- Security rules
- Troubleshooting guide
- Production deployment checklist

## 🚨 Common Mistakes

❌ **Wrong:** Forgetting to pass userId when creating orders
```jsx
// DON'T DO THIS
const orderData = { items, totalAmount };
ordersService.create(orderData);
```

✅ **Right:** Always include userId
```jsx
// DO THIS
const orderData = { userId: user.uid, items, totalAmount };
ordersService.create(orderData);
```

---

❌ **Wrong:** Using Firestore data for auth decisions
```jsx
// DON'T DO THIS
if (userData.isVerified) { // Can be stale!
```

✅ **Right:** Use Redux state from useAuth
```jsx
// DO THIS
const { isAuthenticated } = useAuth(); // Always current
```

---

❌ **Wrong:** Forgetting to add useAuth to App component
```jsx
// App.js
function App() {
  return <Router>...</Router>;
  // Session won't persist on refresh!
}
```

✅ **Right:** Initialize useAuth in App
```jsx
// App.js
import { useAuth } from './hooks/useAuth';

function App() {
  useAuth(); // Initialize on app start
  return <Router>...</Router>;
  // Session persists ✓
}
```

## 🎬 Example: Complete Sign-In Flow

```jsx
// 1. Login Page
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

function LoginPage() {
  return (
    <GoogleSignInButton 
      onSuccess={() => navigate('/')}
    />
  );
}

// 2. App redirects user to home
// 3. Home page can now access user data
function HomePage() {
  const { userData } = useAuth();
  return <h1>Welcome {userData.displayName}!</h1>;
}

// 4. User clicks on "My Orders"
function OrdersPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Get only THIS user's orders
    ordersService.getAll(userData.uid).then(result => {
      setOrders(result.data);
    });
  }, [userData.uid]);

  return orders.map(order => <OrderCard key={order.id} order={order} />);
}

// 5. User clicks "Buy Now"
async function checkout(cartItems, userData) {
  // Create order with userId
  const orderData = {
    userId: userData.uid, // ← CRITICAL
    items: cartItems,
    totalAmount: 1500,
  };
  
  const result = await ordersService.create(orderData);
  navigate(`/orders/${result.id}`);
}
```

## 🔧 Customization

### Change Button Style

```jsx
<GoogleSignInButton 
  variant="secondary"  // primary, secondary, minimal
  size="lg"           // sm, md, lg
  className="custom-class"
/>
```

### Custom Success Handler

```jsx
<GoogleSignInButton 
  onSuccess={(userData) => {
    console.log('User signed in:', userData);
    showWelcomeModal(userData);
  }}
/>
```

### Custom Error Handler

```jsx
<GoogleSignInButton 
  onError={(code, message) => {
    if (code === 'auth/popup-closed-by-user') {
      console.log('User cancelled sign-in');
    }
  }}
/>
```

## 📞 Need Help?

1. Check `GOOGLE_SIGNIN_IMPLEMENTATION.md` for detailed docs
2. Review example files: `COMPLETE_LOGIN_EXAMPLE.jsx`, `COMPLETE_PROFILE_EXAMPLE.jsx`, `COMPLETE_ORDERS_EXAMPLE.jsx`
3. Check Firebase Console for service account and keys
4. Verify Firestore security rules allow access

## ✨ You're All Set!

Your e-commerce app now has:
- ✅ Google Sign-In authentication
- ✅ Automatic user profile creation
- ✅ Session persistence
- ✅ Protected pages
- ✅ User orders tracking
- ✅ Production-ready code

Happy coding! 🎉
