/**
 * FAQ Page
 * صفحة الأسئلة الشائعة
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../constants/routes';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'How do I place an order?',
          a: 'Simply browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or sign in to complete your purchase.',
        },
        {
          q: 'Do I need to create an account to shop?',
          a: 'Yes, creating an account is required to place orders. It helps us track your orders and provide better customer service. Registration is free and takes only a few minutes.',
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order is shipped, you\'ll receive a tracking number via email. You can also check your order status in your account dashboard under "My Orders".',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, Mastercard, American Express) and also offer Cash on Delivery for select areas.',
        },
      ],
    },
    {
      category: 'Shipping',
      questions: [
        {
          q: 'What are your shipping rates?',
          a: 'Standard shipping is $10. We offer FREE shipping on orders over $100. Express shipping options are available at checkout for faster delivery.',
        },
        {
          q: 'How long does shipping take?',
          a: 'Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days. You\'ll receive tracking information once your order ships.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Currently, we only ship within the United States. International shipping options may be available in the future.',
        },
        {
          q: 'Can I change my shipping address after placing an order?',
          a: 'You can change your shipping address within 24 hours of placing your order. After that, please contact our customer service team immediately.',
        },
      ],
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 30-day return policy on most items. Items must be unused, in original packaging, and with all tags attached. Some items may have different return policies.',
        },
        {
          q: 'How do I return an item?',
          a: 'To return an item, go to your account dashboard, select the order, and click "Return Item". Follow the instructions to print a return label and send the item back to us.',
        },
        {
          q: 'How long does it take to process a refund?',
          a: 'Once we receive your returned item, we\'ll process your refund within 5-7 business days. The refund will be credited back to your original payment method.',
        },
        {
          q: 'Do you offer exchanges?',
          a: 'Yes, we offer exchanges for different sizes or colors. Please contact our customer service team to arrange an exchange.',
        },
      ],
    },
    {
      category: 'Products',
      questions: [
        {
          q: 'Are product images accurate?',
          a: 'We strive to provide accurate product images and descriptions. However, actual colors may vary slightly due to monitor settings. Please refer to product specifications for exact details.',
        },
        {
          q: 'What if a product is out of stock?',
          a: 'If a product is out of stock, you can sign up for email notifications to be alerted when it\'s back in stock. We restock popular items regularly.',
        },
        {
          q: 'Do you offer product warranties?',
          a: 'Most products come with manufacturer warranties. Warranty details are included in the product description. Please contact us if you need warranty support.',
        },
        {
          q: 'Can I request a product that\'s not on your website?',
          a: 'We\'re always looking to expand our product range! Please contact our customer service team with product suggestions, and we\'ll do our best to add them.',
        },
      ],
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  let questionIndex = 0;

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our products, shipping, returns, and more.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-primary-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{category.category}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, qIndex) => {
                  const currentIndex = questionIndex++;
                  const isOpen = openIndex === currentIndex;
                  return (
                    <div key={currentIndex} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleFAQ(currentIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 leading-relaxed animate-fade-in">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link
            to={ROUTES.CONTACT}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Contact our support team →
          </Link>
        </div>
      </div>
  );
};

export default FAQ;

