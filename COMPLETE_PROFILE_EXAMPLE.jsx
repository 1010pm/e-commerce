/**
 * COMPLETE PROFILE PAGE EXAMPLE
 * Shows authenticated user profile with Google Sign-In data
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, userData, isAuthenticated, requireAuth, loading } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!requireAuth('/login')) return;
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        phoneNumber: userData.phoneNumber || '',
      });
    }
  }, [userData, requireAuth]);

  const handleLogout = async () => {
    const result = await dispatch(logout());
    if (logout.fulfilled.match(result)) {
      toast.success('Signed out successfully');
      navigate('/login');
    } else {
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Profile Photo */}
              {userData?.photoURL && (
                <img
                  src={userData.photoURL}
                  alt={userData.displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
                  title={`Profile photo from ${userData.provider}`}
                />
              )}

              {/* Profile Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userData?.displayName || user?.email}
                </h1>
                <p className="text-gray-600 mt-1">{userData?.email}</p>
                <div className="flex gap-2 mt-3">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {userData?.provider === 'google' ? '✓ Google' : '✓ Email'}
                  </span>
                  {userData?.role === 'admin' && (
                    <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Email</dt>
                <dd className="text-gray-900">{userData?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Display Name</dt>
                <dd className="text-gray-900">{userData?.displayName || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Phone</dt>
                <dd className="text-gray-900">{userData?.phoneNumber || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Provider</dt>
                <dd className="text-gray-900">
                  {userData?.provider === 'google' ? (
                    <span className="flex items-center gap-2">
                      <img
                        src="https://www.gstatic.com/images/branding/product/1x/googleg_40dp.png"
                        alt="Google"
                        className="w-4 h-4"
                      />
                      Google OAuth
                    </span>
                  ) : (
                    'Email/Password'
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Status</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Status</dt>
                <dd>
                  {userData?.isActive ? (
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Active
                    </span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✗ Disabled
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Email Verified</dt>
                <dd>
                  {userData?.emailVerified ? (
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Member Since</dt>
                <dd className="text-gray-900">
                  {userData?.createdAt?.toDate?.()?.toLocaleDateString() ||
                    'Just now'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                <dd className="text-gray-900">
                  {userData?.updatedAt?.toDate?.()?.toLocaleDateString() ||
                    'Just now'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Shopping Cart
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">📋 About Your Account</h3>
          <p className="text-blue-800 text-sm mb-3">
            {userData?.provider === 'google'
              ? 'Your account is secured with Google Sign-In. You can sign in from any device using your Google account.'
              : 'Your account is secured with a strong password. Keep your password safe and never share it.'}
          </p>
          {userData?.provider === 'google' && (
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Manage Google Account Security
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
