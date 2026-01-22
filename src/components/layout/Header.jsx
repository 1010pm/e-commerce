/**
 * Header Component
 * مكون رأس الصفحة
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { selectCartItemsCount } from '../../store/slices/cartSlice';
import { ROUTES } from '../../constants/routes';
import Button from '../common/Button';
import EmailVerificationBanner from '../common/EmailVerificationBanner';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../store/slices/authSlice';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartItemsCount = useSelector(selectCartItemsCount);
  const { isAuthenticated, user } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutAction());
    navigate(ROUTES.HOME);
  };

  return (
    <>
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex items-center group">
              <span className="text-2xl font-bold gradient-text group-hover:scale-105 transition-transform duration-200">
                E-Store
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full group">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-11 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm focus:shadow-md"
                />
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              </div>
            </form>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
            <Link
              to={ROUTES.PRODUCTS}
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              Products
            </Link>

            <Link
              to={ROUTES.CART}
              className="relative text-gray-700 hover:text-primary-600 transition-all duration-200 p-2.5 rounded-lg hover:bg-primary-50 group"
            >
              <ShoppingCartIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:inline">{user?.displayName || 'Account'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 z-50">
                  <Link
                    to={ROUTES.PROFILE}
                    className="block px-4 py-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150"
                  >
                    Profile
                  </Link>
                  <Link
                    to={ROUTES.ORDERS}
                    className="block px-4 py-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150"
                  >
                    Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to={ROUTES.ADMIN_DASHBOARD}
                      className="block px-4 py-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150 border-t border-gray-100 mt-1"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors duration-150 border-t border-gray-100 mt-1"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-slide-down">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </form>

            <nav className="flex flex-col gap-2">
              <Link
                to={ROUTES.PRODUCTS}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to={ROUTES.CART}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.PROFILE}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to={ROUTES.ORDERS}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to={ROUTES.ADMIN_DASHBOARD}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-center hover:bg-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
        </div>
      </header>
    </>
  );
};

export default Header;

