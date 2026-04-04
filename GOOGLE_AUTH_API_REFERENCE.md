# 📖 Google Authentication API Reference

Complete API documentation for all authentication methods and hooks.

## Table of Contents

1. [useAuth Hook](#useauth-hook)
2. [googleAuthService](#googlauth-service)
3. [Redux Actions](#redux-actions)
4. [GoogleSignInButton Component](#googlesigninbutton-component)
5. [Type Definitions](#type-definitions)

---

## useAuth Hook

Custom React hook for accessing authentication state and utilities.

### Usage

```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const auth = useAuth();
  // Access all auth properties...
}
```

### Properties

#### `user: FirebaseUser | null`
The current Firebase Auth user object.

```javascript
{
  uid: string,
  email: string,
  displayName: string | null,
  photoURL: string | null,
  phoneNumber: string | null,
  emailVerified: boolean,
  isAnonymous: boolean,
  metadata: { creationTime, lastSignInTime },
  providerData: array,
  // ... and more
}
```

**Example:**
```jsx
const { user } = useAuth();
console.log(user.uid);      // Firebase UID
console.log(user.email);    // Email address
console.log(user.photoURL); // Profile photo URL
```

#### `userData: Object | null`
User data from Firestore `users/{uid}` document.

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  phoneNumber: string | null,
  role: 'user' | 'admin',
  provider: 'google' | 'password',
  isActive: boolean,
  emailVerified: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // ... custom fields
}
```

**Example:**
```jsx
const { userData } = useAuth();
console.log(userData.role);       // 'user' or 'admin'
console.log(userData.provider);   // 'google' or 'password'
console.log(userData.isActive);   // Account disabled check
```

#### `isAuthenticated: boolean`
Whether user is currently signed in.

```jsx
const { isAuthenticated } = useAuth();
if (!isAuthenticated) return <LoginPage />;
```

#### `isAdmin: boolean`
Whether user has admin role (userData.role === 'admin').

```jsx
const { isAdmin } = useAuth();
if (isAdmin) {
  return <AdminDashboard />;
}
```

#### `emailVerified: boolean`
Whether user's email is verified (for email/password users).

```jsx
const { emailVerified } = useAuth();
if (!emailVerified) {
  return <VerifyEmailPage />;
}
```

#### `isActive: boolean`
Whether account is active (not disabled by admin).

```jsx
const { isActive } = useAuth();
if (!isActive) {
  return <AccountDisabledPage />;
}
```

#### `loading: boolean`
Whether auth state is loading on app startup.

```jsx
const { loading } = useAuth();
if (loading) {
  return <LoadingSpinner />;
}
```

#### `error: string | null`
Last authentication error message.

```jsx
const { error } = useAuth();
if (error) {
  return <div className="error">{error}</div>;
}
```

### Methods

#### `requireAuth(redirectPath = '/login'): boolean`
Redirect user if not authenticated. Returns `true` if auth check passes.

```jsx
function ProtectedPage() {
  const { requireAuth } = useAuth();
  
  // Redirect if not logged in
  if (!requireAuth('/login')) return null;
  
  return <div>Protected content</div>;
}
```

#### `requireAdmin(redirectPath = '/'): boolean`
Redirect user if not admin. Returns `true` if admin check passes.

```jsx
function AdminPanel() {
  const { requireAdmin } = useAuth();
  
  // Redirect if not admin
  if (!requireAdmin('/')) return null;
  
  return <div>Admin only content</div>;
}
```

### Complete Example

```jsx
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const {
    user,
    userData,
    isAuthenticated,
    isAdmin,
    loading,
    requireAuth
  } = useAuth();

  if (!requireAuth('/login')) return null;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <img src={userData.photoURL} alt={userData.displayName} />
      <p>Welcome, {userData.displayName}</p>
      <p>Email: {userData.email}</p>
      <p>Provider: {userData.provider}</p>
      
      {isAdmin && (
        <a href="/admin">Go to Admin Panel</a>
      )}
    </div>
  );
}
```

---

## googleAuthService

Standalone service module for Google authentication operations.

### Usage

```javascript
import googleAuthService from '../services/google-auth';

const result = await googleAuthService.signInWithGoogle();
```

### Methods

#### `signInWithGoogle(): Promise<SignInResult>`
Authenticate user with Google OAuth popup.

**Returns:**
```javascript
{
  success: boolean,
  user: FirebaseUser | null,
  isNewUser: boolean,
  error?: string,
  code?: string
}
```

**Example:**
```javascript
const result = await googleAuthService.signInWithGoogle();

if (result.success) {
  console.log('User signed in:', result.user.email);
  console.log('Is new user:', result.isNewUser);
  
  if (result.isNewUser) {
    // Firestore document was just created
  }
} else {
  console.error('Sign-in failed:', result.error);
}
```

#### `signOut(): Promise<SignOutResult>`
Sign out current user.

**Returns:**
```javascript
{
  success: boolean,
  error?: string
}
```

**Example:**
```javascript
const result = await googleAuthService.signOut();

if (result.success) {
  console.log('Signed out');
  // Redirect to login
} else {
  console.error('Sign-out failed:', result.error);
}
```

#### `getCurrentUser(): FirebaseUser | null`
Get currently authenticated user.

**Example:**
```javascript
const user = googleAuthService.getCurrentUser();

if (user) {
  console.log('Current user:', user.email);
} else {
  console.log('No user logged in');
}
```

#### `getIdToken(forceRefresh = false): Promise<string | null>`
Get Firebase ID token (for server-side auth).

**Parameters:**
- `forceRefresh` (boolean): Refresh token from server (default: false)

**Example:**
```javascript
// Get cached token
const token = await googleAuthService.getIdToken();

// Force refresh with latest claims
const freshToken = await googleAuthService.getIdToken(true);

// Send to backend
const response = await fetch('/api/protected', {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### `onAuthStateChanged(callback): Function`
Listen to authentication state changes.

**Parameters:**
- `callback` (function): Called with user or null

**Returns:** Unsubscribe function

**Example:**
```javascript
const unsubscribe = googleAuthService.onAuthStateChanged(user => {
  if (user) {
    console.log('User signed in:', user.email);
  } else {
    console.log('User signed out');
  }
});

// Stop listening
unsubscribe();
```

#### `isAuthenticated(): boolean`
Check if user is currently authenticated.

**Example:**
```javascript
if (googleAuthService.isAuthenticated()) {
  // User is logged in
} else {
  // Show login page
}
```

#### `getUserData(uid): Promise<UserDataResult>`
Fetch user data from Firestore.

**Parameters:**
- `uid` (string): User ID (from Firebase Auth)

**Returns:**
```javascript
{
  success: boolean,
  data?: Object,
  error?: string
}
```

**Example:**
```javascript
const result = await googleAuthService.getUserData('user_uid_123');

if (result.success) {
  console.log('User data:', result.data);
  console.log('Role:', result.data.role);
} else {
  console.error('Failed to fetch user data:', result.error);
}
```

#### `updateUserData(uid, data): Promise<UpdateResult>`
Update user data in Firestore.

**Parameters:**
- `uid` (string): User ID
- `data` (object): Fields to update

**Returns:**
```javascript
{
  success: boolean,
  error?: string
}
```

**Example:**
```javascript
const result = await googleAuthService.updateUserData('user_uid_123', {
  phoneNumber: '+1234567890',
  displayName: 'John Doe'
});

if (result.success) {
  console.log('User data updated');
} else {
  console.error('Update failed:', result.error);
}
```

### Complete Example

```javascript
import googleAuthService from '../services/google-auth';

// Sign in
const signIn = async () => {
  const result = await googleAuthService.signInWithGoogle();
  if (result.success) {
    console.log('Welcome,', result.user.displayName);
    return result.user;
  }
};

// Get ID token
const getToken = async () => {
  const token = await googleAuthService.getIdToken(true);
  return token;
};

// Update profile
const updateProfile = async (uid, name) => {
  const result = await googleAuthService.updateUserData(uid, {
    displayName: name
  });
  return result.success;
};

// Listen to auth changes
googleAuthService.onAuthStateChanged(user => {
  if (user) {
    console.log('User changed:', user.email);
  }
});

// Sign out
const signOut = async () => {
  const result = await googleAuthService.signOut();
  if (result.success) {
    console.log('Signed out');
  }
};
```

---

## Redux Actions

Redux Thunks and Actions for auth management.

### googleLogin Thunk

Authenticate with Google OAuth.

```javascript
import { useDispatch } from 'react-redux';
import { googleLogin } from '../store/slices/authSlice';

function LoginButton() {
  const dispatch = useDispatch();

  const handleClick = async () => {
    const result = await dispatch(googleLogin());
    
    if (googleLogin.fulfilled.match(result)) {
      // Success
      console.log('Payload:', result.payload);
      // {
      //   user: FirebaseUser,
      //   userData: {...},
      //   emailVerified: boolean,
      //   isVerified: boolean,
      //   isActive: boolean
      // }
    } else if (googleLogin.rejected.match(result)) {
      // Error
      console.log('Error:', result.payload);
      // { error: 'message', code: 'error_code' }
    }
  };

  return <button onClick={handleClick}>Sign In with Google</button>;
}
```

### logout Thunk

Sign out current user.

```javascript
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

function LogoutButton() {
  const dispatch = useDispatch();

  const handleClick = async () => {
    const result = await dispatch(logout());
    
    if (logout.fulfilled.match(result)) {
      // Signed out
      window.location.href = '/login';
    }
  };

  return <button onClick={handleClick}>Sign Out</button>;
}
```

### Redux State

Access auth state from Redux.

```javascript
import { useSelector } from 'react-redux';

function MyComponent() {
  const {
    user,
    userData,
    isAuthenticated,
    isAdmin,
    emailVerified,
    isActive,
    loading,
    error
  } = useSelector(state => state.auth);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {isAuthenticated && <div>Welcome!</div>}
    </div>
  );
}
```

---

## GoogleSignInButton Component

Reusable button component for Google authentication.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'primary'` | Button style: `'primary'`, `'secondary'`, `'minimal'` |
| `size` | string | `'md'` | Button size: `'sm'`, `'md'`, `'lg'` |
| `fullWidth` | boolean | `false` | Make button full width |
| `className` | string | `''` | Additional CSS classes |
| `onSuccess` | function | `null` | Callback after successful sign-in |
| `onError` | function | `null` | Callback on error |

### Usage

```jsx
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

function LoginPage() {
  const handleSuccess = (userData) => {
    console.log('User signed in:', userData.email);
    // Navigate to home
  };

  const handleError = (code, message) => {
    console.error('Sign-in failed:', message);
  };

  return (
    <GoogleSignInButton
      variant="primary"
      size="md"
      fullWidth={true}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### Variants

#### Primary (Default)
```jsx
<GoogleSignInButton variant="primary" />
```
White background with border, suitable for login pages.

#### Secondary
```jsx
<GoogleSignInButton variant="secondary" />
```
Light blue background, good for prominent CTAs.

#### Minimal
```jsx
<GoogleSignInButton variant="minimal" />
```
Transparent background, minimal styling.

### Sizes

```jsx
<GoogleSignInButton size="sm" />    {/* Small */}
<GoogleSignInButton size="md" />    {/* Medium (default) */}
<GoogleSignInButton size="lg" />    {/* Large */}
```

### Complete Example

```jsx
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <h1>Sign In</h1>
      
      <GoogleSignInButton
        variant="primary"
        size="md"
        fullWidth
        onSuccess={(userData) => {
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }}
        onError={(code, message) => {
          if (code === 'auth/popup-closed-by-user') {
            console.log('User cancelled');
          } else {
            console.error(message);
          }
        }}
      />
      
      <p>Or use email:</p>
      {/* Email login form */}
    </div>
  );
}
```

---

## Type Definitions

### FirebaseUser
```typescript
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  providerData: ProviderUserInfo[];
  // ... more methods
}
```

### UserData
```typescript
interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phoneNumber: string | null;
  role: 'user' | 'admin';
  provider: 'google' | 'password';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  [key: string]: any; // Custom fields
}
```

### AuthState
```typescript
interface AuthState {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  isVerified: boolean;
  isActive: boolean;
}
```

### SignInResult
```typescript
interface SignInResult {
  success: boolean;
  user?: FirebaseUser;
  isNewUser?: boolean;
  error?: string;
  code?: string;
}
```

---

## Error Codes

### Google Auth Errors

| Code | Message | Solution |
|------|---------|----------|
| `auth/popup-closed-by-user` | Sign-in was cancelled | User closed popup, try again |
| `auth/popup-blocked` | Pop-up was blocked | Allow pop-ups in browser settings |
| `auth/network-request-failed` | Network error | Check internet connection |
| `auth/operation-not-allowed` | Google Sign-In disabled | Enable in Firebase Console |
| `auth/credential-already-in-use` | Account already linked | Link to different account |
| `auth/account-disabled` | Account disabled | Contact support |
| `auth/user-disabled` | Account disabled | Contact support |

---

## Best Practices

### ✅ DO

- Always include `userId` when creating orders
- Use `useAuth()` for auth checks in components
- Call `requireAuth()` at start of protected pages
- Handle loading states during auth
- Use `googleAuthService.getIdToken()` for backend auth

### ❌ DON'T

- Don't trust stale userData from Firestore
- Don't forget to unsubscribe from `onAuthStateChanged()`
- Don't use `localStorage` for auth tokens
- Don't expose error codes to users
- Don't make orders without `userId`

---

**Last Updated:** April 2026
**Version:** 1.0.0
