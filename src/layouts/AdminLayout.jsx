/**
 * Admin Layout Component
 * قالب لوحة الإدارة
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate(ROUTES.HOME);
  };

  const menuItems = [
    { icon: HomeIcon, label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD },
    { icon: ShoppingBagIcon, label: 'Products', path: ROUTES.ADMIN_PRODUCTS },
    { icon: TagIcon, label: 'Categories', path: ROUTES.ADMIN_CATEGORIES },
    { icon: TruckIcon, label: 'Orders', path: ROUTES.ADMIN_ORDERS },
    { icon: UsersIcon, label: 'Users', path: ROUTES.ADMIN_USERS },
    { icon: Cog6ToothIcon, label: 'Inventory', path: ROUTES.ADMIN_INVENTORY },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h1 className="text-xl font-bold text-primary-400">Admin Panel</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                  {user?.displayName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.displayName || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-64">
         
          
          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" />
    </ProtectedRoute>
  );
};

export default AdminLayout;

