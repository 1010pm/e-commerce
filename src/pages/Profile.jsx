/**
 * Profile Page - Production Ready
 * Handles user profile management with Firebase Auth and Firestore integration
 * صفحة الملف الشخصي
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import AddressForm from '../components/profile/AddressForm';
import {
  getUserProfile,
  updateUserProfile,
  validatePhoneNumber,
  formatPhoneNumber,
} from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

const Profile = () => {
  const navigate = useNavigate();
  const { user, userData, isAuthenticated } = useAuth();
  const reduxAuth = useSelector((state) => state.auth);

  // State management
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    photoURL: '',
    address: {
      addressLine: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    provider: 'password',
  });

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    // Load user profile on component mount
    loadUserProfile();
  }, [isAuthenticated, user?.uid, navigate]);

  // Load user profile from Firestore
  const loadUserProfile = async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        toast.error('User ID not found');
        return;
      }

      const result = await getUserProfile(user.uid);

      if (result.success) {
        setProfile(result.data);
        setFormData({
          displayName: result.data.displayName,
          phoneNumber: result.data.phoneNumber,
        });
      } else {
        toast.error(result.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    validateField(name, formData[name]);
  };

  // Validate individual field
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'displayName':
        if (!value || value.trim() === '') {
          newErrors.displayName = 'Name is required';
        } else if (value.length < 2) {
          newErrors.displayName = 'Name must be at least 2 characters';
        } else if (value.length > 50) {
          newErrors.displayName = 'Name must not exceed 50 characters';
        } else {
          delete newErrors.displayName;
        }
        break;

      case 'phoneNumber':
        if (value && !validatePhoneNumber(value)) {
          newErrors.phoneNumber = 'Invalid phone number format';
        } else {
          delete newErrors.phoneNumber;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  // Validate form before submit
  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName || formData.displayName.trim() === '') {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setAddressError('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        ...profile,
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
      };

      const result = await updateUserProfile(user.uid, updateData);

      if (result.success) {
        setProfile(updateData);
        setSuccessMessage(result.message || 'Profile updated successfully');
        toast.success(result.message || 'Profile updated! ✅');
        setIsEditingPhone(false);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorMsg = result.error || 'Failed to update profile';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Submit profile error:', error);
      toast.error('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle address save
  const handleAddressSave = async (addressData) => {
    setSuccessMessage('');
    setAddressError('');

    try {
      setIsSaving(true);

      const updateData = {
        ...profile,
        address: addressData,
      };

      const result = await updateUserProfile(user.uid, updateData);

      if (result.success) {
        setProfile(updateData);
        setSuccessMessage(result.message || 'Address saved successfully');
        toast.success(result.message || 'Address updated! ✅');
        setIsEditingAddress(false);

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorMsg = result.error || 'Failed to save address';
        setAddressError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Save address error:', error);
      const errorMsg = 'Failed to save address';
      setAddressError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle address cancel
  const handleAddressCancel = () => {
    setIsEditingAddress(false);
    setAddressError('');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Button onClick={() => navigate(ROUTES.LOGIN)}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <div className="text-center">
                {/* Profile Picture */}
                <div className="mb-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden border-4 border-gray-100 shadow-md">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.displayName || 'User'}
                </h2>

                {/* Email */}
                <p className="text-sm text-gray-600 mb-4">{profile.email}</p>

                {/* Provider Badge */}
                <div className="inline-block">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile.provider === 'google' ? '🔵 Google' : '📧 Email'}
                  </span>
                </div>

                {/* Profile Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Account created</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">
                    {profile.createdAt
                      ? new Date(profile.createdAt.toDate?.() || profile.createdAt).toLocaleDateString()
                      : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Display Name */}
                <div>
                  <Input
                    label="Full Name"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    error={touched.displayName ? errors.displayName : ''}
                    placeholder="John Doe"
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={profile.email}
                    disabled
                    helperText="Your email is managed by your authentication provider"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <Input
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    error={touched.phoneNumber ? errors.phoneNumber : ''}
                    placeholder="+1 (555) 123-4567"
                    disabled={isSaving}
                    helperText={
                      formData.phoneNumber
                        ? `Format: ${formatPhoneNumber(formData.phoneNumber)}`
                        : 'Optional: Include country code for international numbers'
                    }
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSaving}
                  disabled={isSaving}
                  className="mt-8"
                >
                  Save Changes
                </Button>
              </form>
            </div>

            {/* Address Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Shipping Address</h3>
                {!isEditingAddress && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingAddress(true)}
                  >
                    {profile.address?.addressLine ? 'Edit' : 'Add'} Address
                  </Button>
                )}
              </div>

              {isEditingAddress ? (
                <AddressForm
                  address={profile.address}
                  onSave={handleAddressSave}
                  onCancel={handleAddressCancel}
                  loading={isSaving}
                  error={addressError}
                  isEditing={!!profile.address?.addressLine}
                />
              ) : (
                <div>
                  {profile.address?.addressLine ? (
                    <div className="space-y-3 text-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Street Address</p>
                        <p className="text-base font-semibold">{profile.address.addressLine}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">City</p>
                          <p className="text-base font-semibold">{profile.address.city}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">State/Province</p>
                          <p className="text-base font-semibold">
                            {profile.address.state || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Country</p>
                          <p className="text-base font-semibold">{profile.address.country}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Postal Code</p>
                          <p className="text-base font-semibold">{profile.address.zipCode}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                        Last updated:{' '}
                        {profile.updatedAt
                          ? new Date(
                              profile.updatedAt.toDate?.() || profile.updatedAt
                            ).toLocaleDateString()
                          : 'Recently'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">No address added yet</p>
                      <Button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                      >
                        Add Address Now
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Account Information</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {profile.role || 'user'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sign-in Method</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {profile.provider}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

