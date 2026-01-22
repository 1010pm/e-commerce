# 🔧 Authentication Quick Fixes - Priority Order

## 🚨 CRITICAL - Fix Immediately (Before Any Deployment)

### 1. Remove Hardcoded Credentials
**File:** `src/config/firebase.config.js`

**Change:**
```javascript
// ❌ REMOVE hardcoded values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD6NWD6wg...",
  // ...
};

// ✅ TO: Require environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase configuration. Please set environment variables.');
}
```

---

### 2. Fix Firestore Security Rules
**File:** `firestore.rules`

**Change:**
```javascript
// ❌ BEFORE:
function isAdmin() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// ✅ AFTER:
function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

### 3. Sanitize Error Messages
**File:** `src/services/auth.js`

**Add at top:**
```javascript
const getFriendlyErrorMessage = (errorCode) => {
  const errorMap = {
    'auth/email-already-in-use': 'This email is already registered. Please try logging in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/user-not-found': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  };
  
  return errorMap[errorCode] || 'An error occurred. Please try again.';
};
```

**Then update all catch blocks:**
```javascript
catch (error) {
  console.error('Registration error:', error);
  return { 
    success: false, 
    error: getFriendlyErrorMessage(error.code) 
  };
}
```

---

## 🟡 HIGH PRIORITY - Fix Before Production

### 4. Add Basic Rate Limiting
**File:** `src/pages/auth/Login.jsx`

Add this hook at the top of component:
```javascript
const [failedAttempts, setFailedAttempts] = useState(0);
const [lockUntil, setLockUntil] = useState(null);

useEffect(() => {
  const stored = localStorage.getItem('authFailedAttempts');
  if (stored) {
    const data = JSON.parse(stored);
    if (data.lockUntil > Date.now()) {
      setLockUntil(data.lockUntil);
      setFailedAttempts(data.count);
    } else {
      localStorage.removeItem('authFailedAttempts');
    }
  }
}, []);
```

Update handleSubmit:
```javascript
if (lockUntil && Date.now() < lockUntil) {
  const minutes = Math.ceil((lockUntil - Date.now()) / 60000);
  toast.error(`Too many failed attempts. Try again in ${minutes} minute(s).`);
  return;
}

// ... login logic ...

if (!result.success) {
  const newCount = failedAttempts + 1;
  setFailedAttempts(newCount);
  
  if (newCount >= 5) {
    const lockTime = Date.now() + (15 * 60 * 1000); // 15 minutes
    setLockUntil(lockTime);
    localStorage.setItem('authFailedAttempts', JSON.stringify({
      count: newCount,
      lockUntil: lockTime,
    }));
    toast.error('Too many failed attempts. Please try again in 15 minutes.');
  }
} else {
  setFailedAttempts(0);
  localStorage.removeItem('authFailedAttempts');
}
```

---

### 5. Fix Email Verification Polling
**File:** `src/pages/auth/Register.jsx`

**Change line 50-67:**
```javascript
React.useEffect(() => {
  if (emailSent && !emailVerified) {
    let pollCount = 0;
    const maxPolls = 60; // 3 minutes max
    
    const interval = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(interval);
        toast.info('Email verification check timed out. Please refresh the page after verifying your email.');
        return;
      }
      
      const user = getCurrentUser();
      if (user) {
        try {
          const verified = await checkEmailVerification(user);
          if (verified) {
            setEmailVerified(true);
            toast.success('Email verified successfully!');
            clearInterval(interval);
            setTimeout(() => navigate(ROUTES.HOME), 2000);
          }
        } catch (error) {
          console.error('Error checking email verification:', error);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }
}, [emailSent, emailVerified, navigate]);
```

---

## 📋 Testing Checklist

Before deploying, test:

### Registration:
- [ ] Valid email/password registration
- [ ] Duplicate email error (should not reveal email exists)
- [ ] Weak password rejection
- [ ] Network failure handling
- [ ] Email verification flow

### Login:
- [ ] Valid login
- [ ] Invalid credentials (should not reveal which is wrong)
- [ ] 5 failed attempts = lockout
- [ ] Lockout expires after 15 minutes
- [ ] Google OAuth works

### Security:
- [ ] No Firebase credentials in bundle
- [ ] Error messages don't expose Firebase codes
- [ ] Firestore rules work correctly
- [ ] User can't access admin routes

---

## ⚡ Quick Commands

```bash
# 1. Create .env.local file
cp .env.example .env.local
# Edit .env.local with your values

# 2. Test build (check for hardcoded credentials)
npm run build
grep -r "AIzaSy" build/  # Should return nothing

# 3. Deploy Firestore rules
firebase deploy --only firestore:rules

# 4. Run tests (when implemented)
npm test
```

---

**After fixing these 5 critical/high priority issues, your authentication system will be significantly more secure and production-ready.**
