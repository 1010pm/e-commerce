/**
 * Returns Page
 * صفحة الإرجاع والاستبدال
 */

import React from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '../components/common/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const Returns = () => {
  const returnSteps = [
    {
      step: 1,
      title: 'Initiate Return',
      description: 'Go to your account dashboard, select the order, and click "Return Item".',
      icon: ArrowPathIcon,
    },
    {
      step: 2,
      title: 'Print Return Label',
      description: 'Download and print the prepaid return shipping label provided.',
      icon: CheckCircleIcon,
    },
    {
      step: 3,
      title: 'Package Item',
      description: 'Pack the item securely in its original packaging with all accessories and tags.',
      icon: XCircleIcon,
    },
    {
      step: 4,
      title: 'Ship It Back',
      description: 'Attach the return label and drop off at any shipping carrier location.',
      icon: ClockIcon,
    },
    {
      step: 5,
      title: 'Receive Refund',
      description: 'Once we receive and inspect your return, we\'ll process your refund within 5-7 business days.',
      icon: CheckCircleIcon,
    },
  ];

  const eligibleItems = [
    'Items must be unused and in original condition',
    'Original packaging must be included',
    'All tags and labels must be attached',
    'Items must be returned within 30 days of delivery',
    'Receipt or order confirmation required',
  ];

  const nonReturnableItems = [
    'Personalized or customized items',
    'Underwear and intimate apparel',
    'Items damaged by customer misuse',
    'Items without original packaging',
    'Perishable goods and food items',
  ];

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Refunds</h1>
          <p className="text-xl text-gray-600">
            We want you to be completely satisfied with your purchase.
          </p>
        </div>

        {/* Return Policy Banner */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-primary-600 p-3 rounded-lg">
              <ArrowPathIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">30-Day Return Policy</h2>
              <p className="text-gray-700">
                Most items can be returned within 30 days of delivery for a full refund. Items must be unused, 
                in original packaging, and with all tags attached.
              </p>
            </div>
          </div>
        </div>

        {/* Return Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Return an Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {returnSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-lg shadow-md p-6 text-center h-full">
                    <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {index < returnSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform translate-x-full -translate-y-1/2 z-10">
                      <div className="w-6 h-0.5 bg-gray-300"></div>
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-gray-300 border-b-4 border-b-transparent"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Eligible Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              Returnable Items
            </h2>
            <ul className="space-y-3">
              {eligibleItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-Returnable Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircleIcon className="h-6 w-6 text-red-500" />
              Non-Returnable Items
            </h2>
            <ul className="space-y-3">
              {nonReturnableItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refund Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Processing Time</h3>
              <p className="text-gray-700">
                Once we receive your returned item, we'll process your refund within 5-7 business days. 
                You'll receive an email confirmation when the refund is processed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Refund Method</h3>
              <p className="text-gray-700">
                Refunds will be credited back to your original payment method. If you paid by credit card, 
                it may take an additional 5-10 business days for the refund to appear on your statement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Shipping Costs</h3>
              <p className="text-gray-700">
                Return shipping is free for defective or incorrect items. For other returns, return shipping 
                costs are the responsibility of the customer, unless otherwise specified.
              </p>
            </div>
          </div>
        </div>

        {/* Exchange Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Need an Exchange?</h2>
          <p className="text-gray-700 mb-4">
            If you'd like to exchange an item for a different size or color, please contact our customer 
            service team. We'll help you process the exchange quickly.
          </p>
          <Link to={ROUTES.CONTACT}>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Contact Customer Service
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ready to start a return?</p>
          <Link to={ROUTES.ORDERS}>
            <Button size="lg">Go to My Orders</Button>
          </Link>
        </div>
      </div>
  );
};

export default Returns;

