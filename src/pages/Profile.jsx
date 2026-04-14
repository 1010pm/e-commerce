/**
 * Modern Profile Page - Enhanced UI/UX
 * Comprehensive account management with tabs and sections
 * صفحة الملف الشخصي الحديثة
 */

import React, { useState, useEffect } from 'react';
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
import {
  UserIcon,
  MapPinIcon,
  ShieldCheckIcon,
  BellIcon,
  LockClosedIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Tabs for different sections
  const [activeTab, setActiveTab] = useState('personal'); // personal, address, security

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
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');


  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

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

    // Load user profile on component mount
    loadUserProfile();
  }, [isAuthenticated, user?.uid, navigate]);

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

  // Calculate profile completion percentage
  const profileCompletion = () => {
    let completed = 0;
    let total = 5;
    if (profile.displayName) completed++;
    if (profile.phoneNumber) completed++;
    if (profile.address?.addressLine) completed++;
    if (profile.photoURL) completed++;
    if (profile.email) completed++;
    return Math.round((completed / total) * 100);
  };

  // Tab items configuration
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'address', label: 'Address', icon: <MapPinIcon className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheckIcon className="w-5 h-5" /> },

  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 text-lg">Manage your account information and preferences</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3 animate-fade-in-up">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with Profile Card and Tabs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <div className="text-center">
                {/* Profile Picture */}
                <div className="mb-4">
                  <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-bold text-white">
                        {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name and Email */}
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.displayName || 'User'}
                </h2>
                <p className="text-sm text-gray-600 mb-4 break-all">{profile.email}</p>

                {/* Provider Badge */}
                <div className="inline-block mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile.provider === 'google' ? '🔵 Google Account' : '📧 Email & Password'}
                  </span>
                </div>

                {/* Profile Completion */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Profile Completion</span>
                    <span className="text-xs font-bold text-primary-600">{profileCompletion()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profileCompletion()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="p-3 bg-green-50 rounded-lg mb-4 flex items-center gap-2 justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Account Active</span>
                </div>

                {/* Account Stats */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.createdAt
                        ? new Date(profile.createdAt.toDate?.() || profile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recently'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Type</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{profile.role || 'Customer'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row overflow-x-auto border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-4 whitespace-nowrap transition-all duration-200 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-primary-600" />
                        Personal Information
                      </h3>

                      <form onSubmit={handleProfileSubmit} className="space-y-5">
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
                            helperText="Your email cannot be changed. Contact support if needed."
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
                          className="mt-6"
                        >
                          Save Changes
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-primary-600" />
                        Shipping Address
                      </h3>
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
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Street Address</p>
                                <p className="text-base font-semibold text-gray-900">{profile.address.addressLine}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">City</p>
                                <p className="text-base font-semibold text-gray-900">{profile.address.city}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">State/Province</p>
                                <p className="text-base font-semibold text-gray-900">{profile.address.state || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Country</p>
                                <p className="text-base font-semibold text-gray-900">{profile.address.country}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Postal Code</p>
                              <p className="text-base font-semibold text-gray-900">{profile.address.zipCode}</p>
                            </div>

                            <div className="pt-4 border-t border-blue-200">
                              <p className="text-xs text-gray-500">
                                Last updated:{' '}
                                {profile.updatedAt
                                  ? new Date(profile.updatedAt.toDate?.() || profile.updatedAt).toLocaleDateString()
                                  : 'Recently'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4 font-medium">No address added yet</p>
                            <p className="text-sm text-gray-500 mb-6">Add a shipping address for faster checkout</p>
                            <Button
                              type="button"
                              onClick={() => setIsEditingAddress(true)}
                            >
                              Add Address
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
                      Security Settings
                    </h3>

                    {/* Account Security Info */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 space-y-4">
                      <div className="flex items-start gap-4">
                        <LockClosedIcon className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Sign-in Method</p>
                          <p className="text-sm text-gray-600 capitalize">{profile.provider}</p>
                        </div>
                      </div>

                      <div className="border-t border-green-200 pt-4">
                        <div className="flex items-start gap-4">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Account Status</p>
                            <p className="text-sm text-gray-600">Your account is secure and active</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <p className="text-sm text-gray-700 mb-4">
                        To change your password or update security settings, please use your email provider's settings or contact our support team.
                      </p>
                      <Button variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

