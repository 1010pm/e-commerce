/**
 * Shipping Info Page
 * صفحة معلومات الشحن
 */

import React from 'react';
import { TruckIcon, ClockIcon, GlobeAltIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/helpers';
import { APP_CONFIG } from '../constants/config';

const ShippingInfo = () => {
  const shippingOptions = [
    {
      name: 'Standard Shipping',
      price: APP_CONFIG.SHIPPING_COST,
      freeThreshold: APP_CONFIG.FREE_SHIPPING_THRESHOLD,
      time: '5-7 business days',
      icon: TruckIcon,
    },
    {
      name: 'Express Shipping',
      price: 25,
      freeThreshold: 150,
      time: '2-3 business days',
      icon: ClockIcon,
    },
    {
      name: 'Overnight Shipping',
      price: 50,
      freeThreshold: 200,
      time: 'Next business day',
      icon: GlobeAltIcon,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-xl text-gray-600">
            Fast and reliable shipping options to get your orders to you quickly.
          </p>
        </div>

        {/* Free Shipping Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg p-6 mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Free Shipping Available!</h2>
          <p className="text-lg">
            Get FREE standard shipping on orders over {formatCurrency(APP_CONFIG.FREE_SHIPPING_THRESHOLD, APP_CONFIG.CURRENCY, APP_CONFIG.CURRENCY_SYMBOL)}
          </p>
        </div>

        {/* Shipping Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {shippingOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200 hover:border-primary-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{option.name}</h3>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(option.price, APP_CONFIG.CURRENCY, APP_CONFIG.CURRENCY_SYMBOL)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-semibold text-gray-900">{option.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Free over:</span>
                    <span className="font-semibold text-primary-600">{formatCurrency(option.freeThreshold, APP_CONFIG.CURRENCY, APP_CONFIG.CURRENCY_SYMBOL)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shipping Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Processing Time */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Time</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Order Processing</p>
                  <p className="text-gray-600">Orders are typically processed within 1-2 business days.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Order Confirmation</p>
                  <p className="text-gray-600">You'll receive an email confirmation immediately after placing your order.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Tracking Information</p>
                  <p className="text-gray-600">Tracking numbers are sent via email once your order ships.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Delivery Areas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Areas</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">United States</p>
                  <p className="text-gray-600">We ship to all 50 states, including Alaska and Hawaii.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">International Shipping</p>
                  <p className="text-gray-600">Currently available only for select countries. Contact us for details.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">PO Boxes</p>
                  <p className="text-gray-600">We can ship to PO Boxes using standard shipping only.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">Important Notes:</h3>
          <ul className="space-y-2 text-yellow-800">
            <li>• Business days are Monday through Friday, excluding holidays.</li>
            <li>• Delivery times are estimates and may vary due to weather conditions or carrier delays.</li>
            <li>• Some remote areas may experience longer delivery times.</li>
            <li>• Large or heavy items may require special handling and additional shipping time.</li>
            <li>• For urgent orders, please contact our customer service team for special arrangements.</li>
          </ul>
        </div>
      </div>
  );
};

export default ShippingInfo;

