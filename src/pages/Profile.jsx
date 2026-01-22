/**
 * Profile Page
 * صفحة الملف الشخصي
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ProtectedRoute from '../components/common/ProtectedRoute';

const Profile = () => {
  const { user, userData } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || user?.displayName || '',
    email: user?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Update profile
    alert('Profile update functionality coming soon!');
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <Input
                label="Full Name"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                helperText="Email cannot be changed"
              />
            </div>

            <div>
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="input-field"
              />
            </div>

            <div>
              <Button type="submit" size="lg">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;

