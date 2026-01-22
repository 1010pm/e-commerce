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
  onAuthStateChange,
  checkEmailVerification,
} from '../../services/auth';

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
      const isVerified = result.isVerified || false;
      const isActive = result.isActive !== undefined ? result.isActive : true;
      const userDataResult = await getUserData(result.user.uid);
      return { 
        user: result.user, 
        userData: { 
          ...userDataResult.data, 
          emailVerified,
          isVerified,
          isActive,
        },
        emailVerified,
        isVerified,
        isActive,
      };
    }
    return rejectWithValue({ error: result.error, code: result.code, user: result.user });
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    const result = await loginWithGoogle();
    if (result.success) {
      const emailVerified = result.emailVerified || false;
      const isVerified = result.isVerified || false;
      const isActive = result.isActive !== undefined ? result.isActive : true;
      const userDataResult = await getUserData(result.user.uid);
      return { 
        user: result.user, 
        userData: { 
          ...userDataResult.data, 
          emailVerified,
          isVerified,
          isActive,
        },
        emailVerified,
        isVerified,
        isActive,
      };
    }
    return rejectWithValue({ error: result.error, code: result.code, user: result.user });
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
      return result.data;
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
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      // Keep loading true until userData is loaded
      if (action.payload) {
        state.loading = true; // Set loading while fetching user data
      } else {
        state.loading = false; // Set loading false when user is null
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
      // CRITICAL: Check role to determine if user is admin
      // This must be checked every time userData is updated
      state.isAdmin = action.payload.role === 'admin';
      state.emailVerified = action.payload.emailVerified || false;
      state.isVerified = action.payload.isVerified || false;
      state.isActive = action.payload.isActive !== undefined ? action.payload.isActive : true;
      state.loading = false; // Set loading to false after user data is loaded
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
        state.userData = action.payload;
        state.isAdmin = action.payload?.role === 'admin';
        state.emailVerified = action.payload?.emailVerified || false;
        state.isVerified = action.payload?.isVerified || false;
        state.isActive = action.payload?.isActive !== undefined ? action.payload.isActive : true;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, setUserData, clearError, resetAuth, setEmailVerified, setIsVerified, setIsActive } = authSlice.actions;
export default authSlice.reducer;

