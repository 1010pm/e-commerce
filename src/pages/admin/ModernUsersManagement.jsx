/**
 * Modern Users Management Page - Premium Edition
 * Advanced user directory with role management, activity tracking, and analytics
 */

import React, { useEffect, useState } from 'react';
import { usersService } from '../../services/firestore';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import EmptyState from '../../components/admin/EmptyState';
import { SkeletonTable } from '../../components/admin/SkeletonLoader';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ModernUsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, admin, user
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('info'); // info, activity, actions
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await usersService.getAll();
      if (result.success) {
        setUsers(result.data || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter((user) => {
        const lastActive = user.lastActiveAt?.toDate?.() || new Date(user.lastActiveAt);
        const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
        return isActive ? daysSinceActive < 30 : daysSinceActive >= 30;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setUpdatingId(userId);
    try {
      const result = await usersService.delete(userId);
      if (result.success) {
        setUsers(users.filter((u) => u.id !== userId));
        toast.success('✅ User deleted successfully');
        setShowModal(false);
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('❌ Failed to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const userToUpdate = users.find(u => u.id === userId);
      const result = await usersService.update(userId, { ...userToUpdate, role: newRole });
      if (result.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        setSelectedUser({ ...selectedUser, role: newRole });
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-success-500" />
            <span>User role updated to {newRole}</span>
          </div>
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('❌ Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || '?';
  };

  const getAvatarColor = (email) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-indigo-400 to-indigo-600',
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const getLastActiveDays = (date) => {
    if (!date) return 'Never';
    const lastActive = date.toDate?.() || new Date(date);
    const days = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Statistics
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const activeCount = users.filter(u => {
    const lastActive = u.lastActiveAt?.toDate?.() || new Date(u.lastActiveAt);
    const days = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
    return days < 30;
  }).length;

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{adminCount}</p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Regular Users</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{userCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active (30d)</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{activeCount}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active (30d)</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* User Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 bg-gradient-to-br ${getAvatarColor(user.email)} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                          {getInitials(user.displayName, user.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.displayName || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">ID: {user.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={user.role === 'admin' ? 'info' : 'success'}>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                      </Badge>
                    </td>

                    {/* Last Active */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getLastActiveDays(user.lastActiveAt)}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setModalTab('info');
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="👤"
          title="No users found"
          description="Try adjusting your search or filters to find users"
        />
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedUser.displayName || 'User Details'}
          size="lg"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={updatingId === selectedUser.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete User
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className={`h-16 w-16 bg-gradient-to-br ${getAvatarColor(selectedUser.email)} rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
                {getInitials(selectedUser.displayName, selectedUser.email)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedUser.displayName || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge status={selectedUser.role === 'admin' ? 'info' : 'success'}>
                    {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1) || 'User'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                <p className="mt-2 text-sm font-medium text-gray-900 break-all">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{selectedUser.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Joined</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Last Active</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {getLastActiveDays(selectedUser.lastActiveAt)}
                </p>
              </div>
            </div>

            {/* Role Management */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <p className="text-xs font-semibold text-gray-700 uppercase mb-3 block">Change Role</p>
              <div className="flex gap-2">
                {['user', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(selectedUser.id, role)}
                    disabled={updatingId === selectedUser.id}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedUser.role === role
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-indigo-200 text-gray-700 hover:bg-indigo-100'
                    }`}
                  >
                    {role === 'admin' ? '🔑 Admin' : '👤 User'}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-3">Account Information</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">User ID</span>
                <span className="font-medium text-gray-900 font-mono">{selectedUser.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email Verified</span>
                <div className="flex items-center gap-2">
                  {selectedUser.emailVerified ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-600">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ModernUsersManagement;
