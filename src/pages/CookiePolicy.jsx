/**
 * Cookie Policy Page
 * صفحة سياسة الكوكيز
 */

import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const CookiePolicy = () => {
  const cookieTypes = [
    {
      type: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function properly and cannot be switched off in our systems.',
      purpose: [
        'Enable basic website functionality',
        'Maintain your login session',
        'Remember your preferences',
        'Ensure secure transactions',
      ],
      duration: 'Session or up to 1 year',
    },
    {
      type: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      purpose: [
        'Track website traffic and usage patterns',
        'Understand user behavior and preferences',
        'Improve website performance and user experience',
        'Identify areas for improvement',
      ],
      duration: 'Up to 2 years',
    },
    {
      type: 'Marketing Cookies',
      description: 'These cookies are used to deliver advertisements and track campaign performance. They may be set by us or our advertising partners.',
      purpose: [
        'Show you relevant advertisements',
        'Measure advertising campaign effectiveness',
        'Limit the number of times you see an ad',
        'Build a profile of your interests',
      ],
      duration: 'Up to 1 year',
    },
    {
      type: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.',
      purpose: [
        'Remember your language preferences',
        'Remember your location settings',
        'Provide enhanced features and content',
        'Personalize your shopping experience',
      ],
      duration: 'Up to 1 year',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-2">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-gray-600">
            This Cookie Policy explains what cookies are, how we use them on our website, and how you can manage your cookie preferences.
          </p>
        </div>

        {/* What Are Cookies */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
            They are widely used to make websites work more efficiently and to provide information to website owners.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Cookies allow websites to remember your actions and preferences (such as login information, language, 
            font size, and other display preferences) over a period of time, so you don't have to keep re-entering 
            them whenever you come back to the site or browse from one page to another.
          </p>
        </div>

        {/* How We Use Cookies */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use cookies for various purposes, including:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span>To enable certain functions of our website</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span>To provide analytics and help us improve our website</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span>To store your preferences and personalize your experience</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span>To serve advertisements and measure their effectiveness</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span>To enable social media features and content sharing</span>
            </li>
          </ul>
        </div>

        {/* Types of Cookies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {cookieTypes.map((cookie, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{cookie.type}</h3>
                <p className="text-gray-700 mb-4">{cookie.description}</p>
                <div className="mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Purpose:</p>
                  <ul className="space-y-2">
                    {cookie.purpose.map((purpose, pIndex) => (
                      <li key={pIndex} className="flex items-start gap-2 text-gray-700">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{purpose}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-600">
                    <strong>Duration:</strong> {cookie.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Third-Party Cookies */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics 
            of our website and deliver advertisements. Some of these cookies may include:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span><strong>Google Analytics:</strong> To analyze website traffic and user behavior</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span><strong>Social Media Platforms:</strong> To enable social sharing and interaction features</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-600 mt-1">•</span>
              <span><strong>Advertising Networks:</strong> To deliver targeted advertisements</span>
            </li>
          </ul>
        </div>

        {/* Managing Cookies */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to accept or reject cookies. Most web browsers automatically accept cookies, 
                but you can usually modify your browser settings to decline cookies if you prefer.
              </p>
              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="font-semibold mb-2">Browser Settings:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Chrome: Settings → Privacy and security → Cookies</li>
                    <li>• Firefox: Options → Privacy & Security → Cookies</li>
                    <li>• Safari: Preferences → Privacy → Cookies</li>
                    <li>• Edge: Settings → Privacy, search, and services → Cookies</li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <p className="mb-2">
                    <strong>Note:</strong> Disabling cookies may limit your ability to use certain features of our website 
                    and may affect your user experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cookie Consent */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Consent</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you first visit our website, you will be asked to consent to our use of cookies. 
            You can change your cookie preferences at any time through your browser settings or by 
            contacting us directly.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By continuing to use our website after being informed about our use of cookies, you consent 
            to our cookie policy unless you have disabled cookies in your browser settings.
          </p>
        </div>

        {/* Updates */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices or 
            for other operational, legal, or regulatory reasons. We encourage you to review this page 
            periodically for the latest information on our cookie practices.
          </p>
          <div className="mt-4">
            <p className="text-gray-700 mb-2">If you have any questions about our use of cookies, please contact us:</p>
            <div className="space-y-1 text-gray-700">
              <p><strong>Email:</strong> privacy@estore.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CookiePolicy;

