import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.config';
import { refreshUserToken } from './auth';
import { retryWithBackoff, handleNetworkError } from '../utils/errorHandler';

/**
 * Upload image
 */
export const uploadImage = async (file, folder = 'images', id = null) => {
  if (!file) return { success: false, error: 'No file provided' };

  try {
    const timestamp = Date.now();
    const filename = id
      ? `${folder}/${id}/${file.name}`
      : `${folder}/${timestamp}_${file.name}`;

    const storageRef = ref(storage, filename);
    const metadata = { contentType: file.type };

    // Direct upload attempt without pre-checks
    await retryWithBackoff(() => uploadBytes(storageRef, file, metadata));
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL, path: filename };
  } catch (error) {
    console.error('Upload image error:', error);

    // If permission fails, it might be due to a new session/claims
    if (error.code === 'storage/unauthorized') {
      try {
        console.warn('Unauthorized. Attempting token refresh and last retry...');
        await refreshUserToken();
        // One final retry attempt
        const timestamp = Date.now();
        const filename = id ? `${folder}/${id}/${file.name}` : `${folder}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, file, { contentType: file.type });
        const downloadURL = await getDownloadURL(storageRef);
        return { success: true, url: downloadURL, path: filename };
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }

    const networkError = handleNetworkError(error);
    return {
      success: false,
      error: networkError.error || error.message,
      code: error.code || 'upload-failed'
    };
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (files, folder = 'images', id = null) => {
  try {
    const uploadPromises = files.map((file) => uploadImage(file, folder, id));
    const results = await Promise.all(uploadPromises);

    const failures = results.filter((result) => !result.success);
    const success = failures.length === 0;

    if (success) {
      return {
        success: true,
        urls: results.map((result) => result.url),
        paths: results.map((result) => result.path),
      };
    }

    const firstError = failures[0]?.error || 'Some images failed to upload';
    return {
      success: false,
      error: firstError,
      code: failures[0]?.code || 'partial-upload-failure',
      failures: failures.length
    };
  } catch (error) {
    console.error('Upload multiple images error:', error);
    const networkError = handleNetworkError(error);
    return {
      success: false,
      error: networkError.error || error.message,
      code: error.code || 'batch-upload-failed'
    };
  }
};

/**
 * Delete image
 */
export const deleteImage = async (imagePath) => {
  if (!imagePath) return { success: true };

  // Skip deletion for external URLs or local placeholders
  const isStorageUrl = typeof imagePath === 'string' &&
    (imagePath.includes('firebasestorage.googleapis.com') || !imagePath.startsWith('http'));

  if (!isStorageUrl) {
    console.log('Skipping deletion for non-storage image:', imagePath);
    return { success: true };
  }

  try {
    const path = imagePath.startsWith('http')
      ? getStoragePathFromUrl(imagePath)
      : imagePath;

    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    // If image doesn't exist, success
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }
    // Log but don't consider fatal for the database operation if we want robustness
    console.error('Delete image error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete multiple images
 */
export const deleteMultipleImages = async (imagePaths) => {
  if (!imagePaths || imagePaths.length === 0) return { success: true };
  try {
    const deletePromises = imagePaths.map((path) => deleteImage(path));
    const results = await Promise.all(deletePromises);

    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      return { success: false, error: 'Some images could not be deleted' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete multiple images error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Extract storage path from download URL
 */
export const getStoragePathFromUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('/o/')) return url;
  try {
    const startIndex = url.indexOf('/o/') + 3;
    const endIndex = url.indexOf('?') > -1 ? url.indexOf('?') : url.length;
    const encodedPath = url.substring(startIndex, endIndex);
    return decodeURIComponent(encodedPath);
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return url;
  }
};

