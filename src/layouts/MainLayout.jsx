/**
 * Main Layout Component
 * القالب الرئيسي للتطبيق
 */

import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #86efac',
              background: '#f0fdf4',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #fca5a5',
              background: '#fef2f2',
            },
          },
        }}
      />
    </div>
  );
};

export default MainLayout;

