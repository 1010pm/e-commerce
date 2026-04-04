/**
 * GOOGLE SIGN-IN IMPLEMENTATION GUIDE
 * 
 * Complete production-ready Google OAuth integration with Firebase Auth,
 * Redux Toolkit, and Firestore
 */

// ============================================================================
// 1. FIREBASE CONFIGURATION (Already Implemented)
// ============================================================================

/*
File: src/config/firebase.config.js

The Firebase app is already initialized with:
- Firebase Authentication (getAuth)
- Firestore Database (getFirestore)
- Firebase Storage (getStorage)

Google Sign-In is enabled in Firebase Console:
1. Go to Firebase Console > Authentication
2. Click "Sign-in method" tab
3. Enable "Google" provider
4. Add authorized domains if needed
*/

// ============================================================================
// 2. REDUX AUTH SLICE (Already Implemented)
// ============================================================================

/*
File: src/store/slices/authSlice.js

The Redux auth slice already includes:

✅ Initial state with:
   - user: Current Firebase user
   - userData: User data from Firestore
   - loading: Loading state
   - error: Error messages
   - isAuthenticated: Auth status
   - isAdmin: Admin role check
   - emailVerified: Email verification status
   - isActive: Account active status

✅ Async thunks:
   - googleLogin: Handles Google OAuth flow
   - logout: Handles sign out
   - register: Email/password registration
   - login: Email/password login

✅ Reducers:
   - setUser: Set current user
   - setUserData: Set user profile data
   - clearError: Clear error state
   - resetAuth: Reset all auth state

✅ Error handling:
   - Centralized error messages
   - Disabled account detection
   - Rate limiting support
*/

// ============================================================================
// 3. GOOGLE AUTH SERVICE (NEW - Created for This Project)
// ============================================================================

/*
File: src/services/google-auth.js

Standalone service module for Google authentication:

✅ signInWithGoogle():
   - Handles Google OAuth popup
   - Creates user document on first sign-in
   - Updates user document on subsequent sign-ins
   - Checks if account is disabled
   - Returns success/error with user data

✅ signOut():
   - Signs out from Firebase Auth
   - Logs logout event
   - Returns success/error

✅ getCurrentUser():
   - Returns current Firebase user

✅ getIdToken(forceRefresh):
   - Gets Firebase ID token (for server auth)

✅ onAuthStateChanged(callback):
   - Listens to auth state changes

✅ isAuthenticated():
   - Checks if user is signed in

✅ getUserData(uid):
   - Fetches user data from Firestore

✅ updateUserData(uid, data):
   - Updates user profile in Firestore
*/

// ============================================================================
// 4. GOOGLE SIGN-IN BUTTON COMPONENT (NEW)
// ============================================================================

/*
File: src/components/auth/GoogleSignInButton.jsx

Reusable button component with:

✅ Loading state:
   - Shows spinner during sign-in
   - Disables button while processing

✅ Error handling:
   - Displays error messages
   - Handles popup closed errors
   - Handles network errors

✅ Customization:
   - variant: 'primary' | 'secondary' | 'minimal'
   - size: 'sm' | 'md' | 'lg'
   - fullWidth: boolean
   - className: string for additional styles
   - onSuccess: callback after login
   - onError: callback on error

✅ Accessibility:
   - Proper ARIA labels
   - Keyboard navigation support
   - Semantic HTML

✅ Google Icon:
   - Official Google SVG icon
   - Matches Material Design specs
*/

// ============================================================================
// 5. AUTHENTICATION FLOW
// ============================================================================

/*
USER SIGN-IN FLOW:

1. User clicks "Continue with Google" button
2. GoogleSignInButton dispatches googleLogin() thunk
3. googleLogin() calls loginWithGoogle() service
4. Firebase shows Google OAuth popup
5. User authorizes app
6. Firebase returns signed-in user
7. Check if user exists in Firestore:
   - NEW USER: Create document with:
     * uid, name, email, photoURL
     * provider: 'google'
     * createdAt: serverTimestamp()
     * role: 'user'
     * isActive: true
   - EXISTING USER: Update last login timestamp
8. Redux auth slice updates with user data
9. User is redirected to dashboard/home
10. useAuth hook syncs state and prevents stale data

AUTOMATIC SIGN-IN ON REFRESH:

1. useAuth hook calls onAuthStateChange on mount
2. Firebase checks if user is still logged in
3. If yes, dispatch setUser with Firebase user
4. Fetch Firestore user document
5. Update Redux with complete user data
6. User remains logged in without signing again
*/

// ============================================================================
// 6. ORDERS INTEGRATION (CRITICAL)
// ============================================================================

/*
File: src/services/firestore.js

Orders service already implements userId correctly:

✅ ordersService.getAll(userId):
   - Accepts userId parameter
   - Queries: where('userId', '==', userId)
   - Returns only user's orders

✅ ordersService.create(orderData):
   - IMPORTANT: Include userId in orderData
   - Store userId with every order
   - Maintains user-order relationship

WHEN CREATING AN ORDER:

const orderData = {
  userId: user.uid,  // ← CRITICAL: Always include this
  items: cartItems,
  totalAmount: 1500,
  shippingAddress: {...},
  status: 'pending',
  // ... other fields
};

const result = await ordersService.create(orderData);

FETCHING USER'S ORDERS:

const { data: orders } = await ordersService.getAll(user.uid);
// Returns only orders where userId === user.uid
*/

// ============================================================================
// 7. AUTHENTICATION HOOK (Already Implemented)
// ============================================================================

/*
File: src/hooks/useAuth.js

Custom React hook for easy auth access:

const {
  user,              // Firebase user object
  userData,          // Firestore user document
  isAuthenticated,   // Boolean
  isAdmin,           // Boolean (role === 'admin')
  emailVerified,     // Boolean (for email/password users)
  isActive,          // Boolean (not disabled)
  loading,           // Boolean (initial load)
  error,             // Error message
  requireAuth,       // Function: redirect if not authenticated
  requireAdmin,      // Function: redirect if not admin
} = useAuth();

USING IN COMPONENTS:

import { useAuth } from '../hooks/useAuth';

function Profile() {
  const { user, userData, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Redirect to="/login" />;
  
  return (
    <div>
      <h1>Welcome, {userData?.displayName}</h1>
      <img src={userData?.photoURL} alt="Profile" />
      <p>{userData?.email}</p>
    </div>
  );
}
*/

// ============================================================================
// 8. USAGE EXAMPLES
// ============================================================================

/*
EXAMPLE 1: Login Page with Google Sign-In Button

File: src/pages/auth/Login.jsx

import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

function Login() {
  const navigate = useNavigate();

  const handleGoogleSuccess = (userData) => {
    // Custom logic after successful sign-in
    console.log('Signed in as:', userData.email);
    // Navigation is handled automatically by component
  };

  const handleGoogleError = (errorCode, errorMessage) => {
    // Custom error handling
    console.error('Sign-in failed:', errorMessage);
  };

  return (
    <div className="login-container">
      <h1>Sign In</h1>
      
      <GoogleSignInButton
        variant="primary"
        size="md"
        fullWidth={true}
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
      
      <p>Or sign in with email</p>
      {/* Email login form */}
    </div>
  );
}
*/

/*
EXAMPLE 2: Protected Profile Page

File: src/pages/Profile.jsx

import { useAuth } from '../hooks/useAuth';

function Profile() {
  const { userData, isAuthenticated, requireAuth } = useAuth();

  // Require authentication
  if (!requireAuth('/login')) return null;

  return (
    <div className="profile">
      <h1>My Profile</h1>
      
      <div className="profile-header">
        {userData?.photoURL && (
          <img 
            src={userData.photoURL} 
            alt={userData.displayName}
            className="profile-photo"
          />
        )}
        <div>
          <h2>{userData?.displayName || userData?.email}</h2>
          <p>{userData?.email}</p>
        </div>
      </div>

      <div className="profile-section">
        <h3>Account Info</h3>
        <p>Provider: {userData?.provider === 'google' ? 'Google' : 'Email'}</p>
        <p>Member since: {userData?.createdAt?.toDate().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
*/

/*
EXAMPLE 3: Fetching User Orders

File: src/pages/Orders.jsx

import { useAuth } from '../hooks/useAuth';
import { ordersService } from '../services/firestore';

function Orders() {
  const { userData, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !userData?.uid) return;

    const fetchOrders = async () => {
      const result = await ordersService.getAll(userData.uid);
      if (result.success) {
        setOrders(result.data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [isAuthenticated, userData?.uid]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="orders">
      <h1>My Orders</h1>
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <ul>
          {orders.map(order => (
            <li key={order.id}>
              Order #{order.id}
              <p>Amount: ${order.totalAmount}</p>
              <p>Status: {order.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
*/

/*
EXAMPLE 4: Creating an Order with userId

File: src/services/checkout.js

import { useAuth } from '../hooks/useAuth';
import { ordersService } from './firestore';

async function createOrder(cartItems, shippingAddress, userData) {
  const orderData = {
    userId: userData.uid,  // ← CRITICAL: Include user ID
    items: cartItems,
    totalAmount: calculateTotal(cartItems),
    shippingAddress: shippingAddress,
    status: 'pending',
    createdAt: new Date(),
  };

  const result = await ordersService.create(orderData);
  if (result.success) {
    console.log('Order created:', result.id);
    return result;
  } else {
    console.error('Order creation failed:', result.error);
    throw new Error(result.error);
  }
}

// In a React component:
function Checkout() {
  const { userData, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmitOrder = async (cartItems, shippingAddress) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const order = await createOrder(cartItems, shippingAddress, userData);
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmitOrder(cartItems, shippingAddress);
    }}>
      {/* Checkout form */}
    </form>
  );
}
*/

/*
EXAMPLE 5: Using Google Auth Service Directly

File: src/services/user-profile.js

import googleAuthService from '../services/google-auth';

// Sign out and clean up
async function handleSignOut() {
  const result = await googleAuthService.signOut();
  if (result.success) {
    window.location.href = '/';
  }
}

// Update user profile
async function updateProfile(userData) {
  const user = googleAuthService.getCurrentUser();
  if (!user) return;

  const result = await googleAuthService.updateUserData(user.uid, {
    displayName: userData.displayName,
    // ... other fields
  });

  if (result.success) {
    toast.success('Profile updated');
  }
}

// Get fresh ID token
async function getAuthToken() {
  const token = await googleAuthService.getIdToken(true);
  return token;
}
*/

// ============================================================================
// 9. FIRESTORE COLLECTION STRUCTURE
// ============================================================================

/*
DATABASE STRUCTURE:

users/ collection
  {uid}/ document
    - uid: string (matches Firebase Auth UID)
    - email: string
    - displayName: string
    - photoURL: string | null
    - phoneNumber: string | null
    - role: 'user' | 'admin'
    - provider: 'google' | 'password'
    - isActive: boolean
    - emailVerified: boolean (for email/password users)
    - createdAt: Timestamp
    - updatedAt: Timestamp
    - address?: { street, city, state, zip, country }
    - phone?: string
    - preferences?: { newsletter, notifications, ... }

orders/ collection
  {orderId}/ document
    - userId: string (CRITICAL: links to users/{uid})
    - items: array of { productId, name, price, quantity }
    - totalAmount: number
    - shippingAddress: object
    - status: 'pending' | 'processing' | 'shipped' | 'delivered'
    - createdAt: Timestamp
    - updatedAt: Timestamp
    - paymentMethod: string
    - trackingNumber?: string

products/ collection
  {productId}/ document
    - name: string
    - description: string
    - price: number
    - images: array of URLs
    - category: string
    - inStock: boolean
    - inventory: number
    - createdAt: Timestamp

carts/ collection
  {cartId}/ document
    - userId: string
    - items: array of { productId, quantity, price }
    - createdAt: Timestamp
    - updatedAt: Timestamp
*/

// ============================================================================
// 10. SECURITY RULES (Firestore)
// ============================================================================

/*
File: firestore.rules

Important security rules to implement:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own document
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid && 
                       request.resource.data.uid == request.auth.uid &&
                       request.resource.data.email == request.auth.token.email;
      allow update: if request.auth.uid == uid;
    }
    
    // Orders can only be accessed by the owner
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
    }
    
    // Products are public for reading
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Helper function
    function isAdmin() {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
*/

// ============================================================================
// 11. ENVIRONMENT VARIABLES
// ============================================================================

/*
File: .env.local

REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
*/

// ============================================================================
// 12. DEVELOPMENT CHECKLIST
// ============================================================================

/*
✅ IMPLEMENTATION CHECKLIST:

Authentication:
  ☐ Firebase project created
  ☐ Google provider enabled in Firebase Console
  ☐ Firebase config added to .env.local
  ☐ Google OAuth credentials configured
  ☐ Authorized JavaScript origins added
  ☐ Authorized redirect URIs added

Redux:
  ☐ Auth slice created with googleLogin thunk
  ☐ Store configured with auth reducer
  ☐ Middleware configured to handle Firebase user objects

Services:
  ☐ Auth service with loginWithGoogle()
  ☐ Google auth service created (google-auth.js)
  ☐ Orders service includes userId in queries
  ☐ Firestore user documents created on first sign-in

Components:
  ☐ GoogleSignInButton component created
  ☐ Login page uses GoogleSignInButton
  ☐ Protected routes check isAuthenticated
  ☐ Profile page displays user data
  ☐ Orders page filters by userId

Hooks:
  ☐ useAuth hook created
  ☐ useAuth initializes auth state on app load
  ☐ useAuth syncs on auth state changes
  ☐ Components use useAuth for auth checks

Firestore:
  ☐ Users collection structure created
  ☐ Orders collection includes userId field
  ☐ Security rules prevent unauthorized access
  ☐ Documents use serverTimestamp()

Testing:
  ☐ Sign in with Google works
  ☐ Session persists on page refresh
  ☐ User data displays correctly
  ☐ Logout clears auth state
  ☐ Orders filtered by user ID
  ☐ Protected routes redirect unauthenticated users
  ☐ Admin users see admin dashboard
  ☐ Disabled accounts cannot sign in
*/

// ============================================================================
// 13. TROUBLESHOOTING
// ============================================================================

/*
ISSUE: "OAuth redirect URI mismatch"
FIX: Add your domain to authorized redirect URIs in Firebase Console
    Settings > Authentication > Authorized domains

ISSUE: Google popup doesn't open
FIX: Check browser popup blocker settings
    Some domains require https, add localhost to authorized origins

ISSUE: Session lost on page refresh
FIX: Ensure useAuth hook is called in App.js
    Hook must initialize onAuthStateChange before components mount

ISSUE: User data not loading
FIX: Check Firestore user document is created
    Verify userId is stored correctly in orders
    Check Firestore security rules allow access

ISSUE: "Firebase has no compat mode" error
FIX: Use firebase v9+ modular SDK
    Import from 'firebase/auth', not 'firebase'

ISSUE: "auth/account-disabled" error
FIX: Check Firestore users document, set isActive: true
    Admin may have disabled account, contact admin
*/

// ============================================================================
// 14. PRODUCTION DEPLOYMENT
// ============================================================================

/*
BEFORE PRODUCTION:

1. Security Rules:
   ☐ Firestore rules enforce userId checks
   ☐ Rules prevent direct document writes
   ☐ Only authenticated users can access data
   ☐ Admin role required for sensitive operations

2. Environment:
   ☐ Use .env.local for sensitive keys
   ☐ Never commit Firebase keys to version control
   ☐ Use Firebase environment configuration
   ☐ Enable App Check in Firebase Console

3. Firebase Console:
   ☐ Add production domain to authorized origins
   ☐ Set custom claims for admin users
   ☐ Enable HTTPS requirement
   ☐ Review access logs and audit trails

4. Code:
   ☐ Remove console.logs in production
   ☐ Implement error boundaries
   ☐ Add loading states everywhere
   ☐ Handle network timeouts gracefully

5. Testing:
   ☐ Test sign in/sign out flow
   ☐ Test session persistence
   ☐ Test protected routes
   ☐ Test orders for each user
   ☐ Test admin access

6. Monitoring:
   ☐ Set up Firebase Analytics
   ☐ Monitor authentication errors
   ☐ Track user signups and sign-ins
   ☐ Set up error reporting
*/

export {};
