/**
 * User Service
 * Handles all user profile operations and Firestore integration
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';

/**
 * Get user profile from Firestore
 * Merges Firebase Auth data with Firestore profile data
 */
export const getUserProfile = async (uid) => {
  try {
    if (!uid) {
      return { success: false, error: 'No user ID provided' };
    }

    // Get user document from Firestore
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    // Get current Firebase Auth user
    const currentUser = auth.currentUser;

    let profile = {
      uid,
      displayName: '',
      email: '',
      photoURL: '',
      phoneNumber: '',
      address: {
        addressLine: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      role: 'user',
      provider: 'password',
      isActive: true,
      createdAt: null,
      updatedAt: null,
    };

    // Merge Firebase Auth data (primary source for these fields)
    if (currentUser) {
      profile.displayName = currentUser.displayName || profile.displayName;
      profile.email = currentUser.email || profile.email;
      profile.photoURL = currentUser.photoURL || profile.photoURL;
      profile.phoneNumber = currentUser.phoneNumber || profile.phoneNumber;
    }

    // Merge Firestore data (preserves additional fields)
    if (userDocSnap.exists()) {
      const firestoreData = userDocSnap.data();
      profile = {
        ...profile,
        ...firestoreData,
        // Always use Auth as primary source for these
        displayName: currentUser?.displayName || firestoreData.displayName || profile.displayName,
        email: currentUser?.email || firestoreData.email || profile.email,
        photoURL: currentUser?.photoURL || firestoreData.photoURL || profile.photoURL,
        phoneNumber: currentUser?.phoneNumber || firestoreData.phoneNumber || profile.phoneNumber,
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user profile',
    };
  }
};

/**
 * Update user profile in Firestore
 * Handles phone number and address updates
 */
export const updateUserProfile = async (uid, profileData) => {
  try {
    if (!uid) {
      return { success: false, error: 'No user ID provided' };
    }

    if (!profileData || typeof profileData !== 'object') {
      return { success: false, error: 'Invalid profile data' };
    }

    const userDocRef = doc(db, 'users', uid);

    // Prepare data for Firestore
    const updateData = {
      ...profileData,
      updatedAt: serverTimestamp(),
    };

    // Remove sensitive fields that shouldn't be in Firestore
    delete updateData.uid;
    delete updateData.email; // Email is managed by Firebase Auth
    delete updateData.photoURL; // PhotoURL is managed by Firebase Auth
    delete updateData.provider; // Provider is managed by Firebase Auth

    // Try to update existing document
    try {
      await updateDoc(userDocRef, updateData);
      return {
        success: true,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        const currentUser = auth.currentUser;
        await setDoc(userDocRef, {
          uid,
          displayName: currentUser?.displayName || profileData.displayName || '',
          email: currentUser?.email || profileData.email || '',
          photoURL: currentUser?.photoURL || profileData.photoURL || '',
          phoneNumber: currentUser?.phoneNumber || profileData.phoneNumber || '',
          address: profileData.address || {
            addressLine: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
          },
          role: profileData.role || 'user',
          provider: profileData.provider || 'password',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return {
          success: true,
          message: 'Profile created successfully',
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update user profile',
    };
  }
};

/**
 * Initialize user profile after registration
 * Called after user signs up
 */
export const initializeUserProfile = async (uid, initialData = {}) => {
  try {
    const currentUser = auth.currentUser;

    const profileData = {
      uid,
      displayName: initialData.displayName || currentUser?.displayName || '',
      email: currentUser?.email || initialData.email || '',
      photoURL: currentUser?.photoURL || initialData.photoURL || '',
      phoneNumber: currentUser?.phoneNumber || initialData.phoneNumber || '',
      address: initialData.address || {
        addressLine: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      role: 'user',
      provider: initialData.provider || 'password',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, profileData);

    return {
      success: true,
      message: 'User profile initialized',
      data: profileData,
    };
  } catch (error) {
    console.error('Initialize user profile error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize user profile',
    };
  }
};

/**
 * Validate phone number format
 * Supports multiple formats
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return true; // Optional field

  // Remove spaces and special characters for validation
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Should be 7-15 digits (international standard)
  if (cleaned.length < 7 || cleaned.length > 15) {
    return false;
  }

  return true;
};

/**
 * Validate address data
 */
export const validateAddress = (address) => {
  if (!address) return { valid: false, message: 'Address is required' };

  const { addressLine, city, state, country, zipCode } = address;

  if (!addressLine || addressLine.trim() === '') {
    return { valid: false, message: 'Address line is required' };
  }

  if (!city || city.trim() === '') {
    return { valid: false, message: 'City is required' };
  }

  if (!country || country.trim() === '') {
    return { valid: false, message: 'Country is required' };
  }

  // Zip code validation (flexible for international formats)
  if (!zipCode || zipCode.trim() === '') {
    return { valid: false, message: 'Postal code is required' };
  }

  return { valid: true, message: 'Address is valid' };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    // International: +X XXX-XXX-XXXX
    return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if doesn't match known formats
  return phoneNumber;
};

/**
 * Get user by email (admin/lookup purposes)
 */
export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'User not found' };
    }

    const userDoc = querySnapshot.docs[0];
    return {
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    };
  } catch (error) {
    console.error('Get user by email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if phone number is already in use
 */
export const isPhoneNumberInUse = async (phoneNumber, excludeUid = null) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('phoneNumber', '==', phoneNumber)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { inUse: false };
    }

    // If excluding a specific user (update scenario)
    if (excludeUid) {
      const filtered = querySnapshot.docs.filter(doc => doc.id !== excludeUid);
      return { inUse: filtered.length > 0 };
    }

    return { inUse: true };
  } catch (error) {
    console.error('Check phone number error:', error);
    return { inUse: false, error: error.message };
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  initializeUserProfile,
  validatePhoneNumber,
  validateAddress,
  formatPhoneNumber,
  getUserByEmail,
  isPhoneNumberInUse,
};
