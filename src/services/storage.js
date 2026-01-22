/**
 * Firebase Storage Service
 * خدمة التخزين في Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.config';

/**
 * Upload image
 */
export const uploadImage = async (file, folder = 'images') => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}_${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, filename);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return { success: true, url: downloadURL, path: filename };
  } catch (error) {
    console.error('Upload image error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (files, folder = 'images') => {
  try {
    const uploadPromises = files.map((file) => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    
    const success = results.every((result) => result.success);
    
    if (success) {
      return {
        success: true,
        urls: results.map((result) => result.url),
        paths: results.map((result) => result.path),
      };
    }
    
    return { success: false, error: 'Some images failed to upload' };
  } catch (error) {
    console.error('Upload multiple images error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete image
 */
export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    console.error('Delete image error:', error);
    return { success: false, error: error.message };
  }
};

