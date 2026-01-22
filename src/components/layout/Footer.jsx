/**
 * Footer Component
 * مكون تذييل الصفحة
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-auto border-t border-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4 gradient-text bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              E-Store
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Your trusted online shopping destination for quality products at great prices.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-5 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to={ROUTES.HOME} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Home
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRODUCTS} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Products
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CART} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Cart
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PROFILE} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold mb-5 text-lg">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link to={ROUTES.CONTACT} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to={ROUTES.FAQ} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SHIPPING} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to={ROUTES.RETURNS} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-5 text-lg">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to={ROUTES.PRIVACY} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to={ROUTES.TERMS} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to={ROUTES.COOKIES} className="text-gray-400 hover:text-primary-400 transition-colors duration-200 inline-block hover:translate-x-1">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} E-Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

