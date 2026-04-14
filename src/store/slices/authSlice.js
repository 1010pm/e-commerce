/**
 * Auth Redux Slice
 * شريحة Redux للمصادقة
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  getUserData,
} from '../../services/auth';
import { serializeFirestoreData } from '../../utils/firebaseSerializer.js';

// Initial state
const initialState = {
  user: null,
  userData: null,
  loading: true,  // Start with loading = true to wait for auth state
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  emailVerified: false,
  isVerified: false,    // Business verification flag
  isActive: false,       // Admin-controlled active status
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, userData }, { rejectWithValue }) => {
    const result = await registerUser(email, password, userData);
    if (result.success) {
      // After registration, user is signed out, so we can't get userData yet
      // Return with default values (user must verify email first)
      return {
        user: result.user,
        userData: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: userData?.displayName || '',
          emailVerified: false,
          isVerified: false,
          isActive: true,
          provider: 'password',
        },
        emailSent: result.emailSent || false
      };
    }
    return rejectWithValue({ error: result.error, code: result.code });
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const result = await loginUser(email, password);
    if (result.success) {
      const emailVerified = result.emailVerified || false;
      const isVerified = emailVerified; // Mapped for backward compatibility
      const isActive = result.isActive !== undefined ? result.isActive : true; // Default active

      // Base user data from Auth
      let userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        role: 'user',
        provider: result.provider || 'password',
        emailVerified,
        isVerified,
        isActive,
      };

      // If verified (or Google), try to fetch additional profile data from Firestore
      // BUT NEVER overwrite our Auth-derived verification status
      if (emailVerified) {
        try {
          const userDataResult = await getUserData(result.user.uid);
          if (userDataResult.success && userDataResult.data) {
            const fd = userDataResult.data;
            userData = {
              ...userData,
              ...fd, // Merge profile data (already serialized from getUserData)
              // Restore strict auth values to prevent overwrites
              provider: result.provider || 'password',
              emailVerified,
              isVerified,
              isActive: fd.isActive !== undefined ? fd.isActive : isActive,
            };
          }
        } catch (e) {
          // Ignore Firestore read errors, proceed with basics
        }
      }

      // Ensure userData is serializable before returning
      const serializedUserData = serializeFirestoreData(userData);

      return {
        user: result.user,
        userData: serializedUserData,
        emailVerified,
        isVerified,
        isActive: serializedUserData.isActive,
      };
    }
    return rejectWithValue({ error: result.error, code: result.code, user: result.user, email: result.email }); // Keep error payload structure
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    const result = await loginWithGoogle();
    if (result.success) {
      const emailVerified = result.emailVerified || false;
      const isActive = result.isActive !== undefined ? result.isActive : true;
      let userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        role: 'user',
        provider: result.provider || 'google',
        emailVerified, // Always true for Google
        isVerified: emailVerified,
        isActive,
      };

      try {
        const userDataResult = await getUserData(result.user.uid);
        if (userDataResult.success && userDataResult.data) {
          const fd = userDataResult.data;
          userData = {
            ...userData,
            ...fd, // Already serialized from getUserData
            provider: result.provider || 'google',
            emailVerified,
            isVerified: emailVerified,
            isActive: fd.isActive !== undefined ? fd.isActive : isActive
          };
        }
      } catch (e) {
        // Ignore errors
      }

      // Ensure userData is serializable
      const serializedUserData = serializeFirestoreData(userData);

      return {
        user: result.user,
        userData: serializedUserData,
        emailVerified,
        isVerified: emailVerified,
        isActive: serializedUserData.isActive,
      };
    }
    return rejectWithValue({ error: result.error, code: result.code, user: result.user, email: result.user?.email });
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const result = await logoutUser();
    if (result.success) {
      return null;
    }
    return rejectWithValue(result.error);
  }
);

export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async (uid, { rejectWithValue }) => {
    const result = await getUserData(uid);
    if (result.success) {
      // Ensure data is serialized (should already be from getUserData)
      return serializeFirestoreData(result.data);
    }
    return rejectWithValue(result.error);
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const newUser = action.payload;
      state.user = newUser;
      state.isAuthenticated = !!newUser;
      if (newUser) {
        // Don't set loading=true if we already have userData for this user (e.g. from login.fulfilled)
        // Prevents infinite loading when onAuthStateChange fires right after login
        const isSameUserWithData = state.userData?.uid === newUser.uid;
        if (!isSameUserWithData) {
          state.loading = true;
        }
      } else {
        state.loading = false;
      }
    },
    setUserData: (state, action) => {
      if (!action.payload) {
        state.userData = null;
        state.isAdmin = false;
        state.emailVerified = false;
        state.isVerified = false;
        state.isActive = false;
        state.loading = false;
        return;
      }

      state.userData = action.payload;
      state.isAdmin = action.payload.role === 'admin';

      // CRITICAL: Source of truth is the payload properties (from useAuth), NOT the inner properties if they conflict
      // But typically payload structure is { ...userData, emailVerified: true }
      state.emailVerified = action.payload.emailVerified === true;
      state.isVerified = action.payload.isVerified === true; // Keep backward compat
      state.isActive = action.payload.isActive !== undefined ? action.payload.isActive : true;

      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.userData = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.emailVerified = false;
      state.isVerified = false;
      state.isActive = false;
      state.error = null;
    },
    setEmailVerified: (state, action) => {
      state.emailVerified = action.payload;
      if (state.userData) {
        state.userData.emailVerified = action.payload;
      }
    },
    setIsVerified: (state, action) => {
      state.isVerified = action.payload;
      if (state.userData) {
        state.userData.isVerified = action.payload;
      }
    },
    setIsActive: (state, action) => {
      state.isActive = action.payload;
      if (state.userData) {
        state.userData.isActive = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.userData = action.payload.userData;
        // After registration, user is signed out, so isAuthenticated should be false
        state.isAuthenticated = false;
        state.isAdmin = action.payload.userData?.role === 'admin';
        state.emailVerified = action.payload.userData?.emailVerified || false;
        state.isVerified = action.payload.userData?.isVerified || false;
        state.isActive = action.payload.userData?.isActive !== undefined ? action.payload.userData.isActive : true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.payload;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.userData = action.payload.userData;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.userData?.role === 'admin';
        state.emailVerified = action.payload.emailVerified || false;
        state.isVerified = action.payload.isVerified || false;
        state.isActive = action.payload.isActive !== undefined ? action.payload.isActive : true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.payload;
      });

    // Google Login
    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.userData = action.payload.userData;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.userData?.role === 'admin';
        state.emailVerified = action.payload.emailVerified || false;
        state.isVerified = action.payload.isVerified || false;
        state.isActive = action.payload.isActive !== undefined ? action.payload.isActive : true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.payload;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.userData = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.emailVerified = false;
        state.isVerified = false;
        state.isActive = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch User Data
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        // CRITICAL: NEVER overwrite emailVerified/isVerified from Firestore - Firebase Auth is source of truth
        // These are only set to true when user actually clicks verification link (via useAuth/checkEmailVerification)
        const payload = action.payload || {};
        state.userData = { ...payload, emailVerified: state.emailVerified, isVerified: state.isVerified };
        state.isAdmin = payload?.role === 'admin';
        // Preserve emailVerified/isVerified - do NOT use Firestore values
        state.isActive = payload?.isActive !== undefined ? payload.isActive : true;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, setUserData, clearError, resetAuth, setEmailVerified, setIsVerified, setIsActive } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectUserData = (state) => state.auth.userData;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.isAdmin;
export const selectIsVerified = (state) => state.auth.isVerified;
export const selectEmailVerified = (state) => state.auth.emailVerified;
export const selectIsActive = (state) => state.auth.isActive;
export const selectAuthLoading = (state) => state.auth.loading;

export default authSlice.reducer;

