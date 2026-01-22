/**
 * Privacy Policy Page
 * صفحة سياسة الخصوصية
 */

import React from 'react';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        'We collect information that you provide directly to us, including your name, email address, shipping address, payment information, and phone number when you create an account, place an order, or contact us.',
        'We automatically collect certain information when you visit our website, including your IP address, browser type, device information, and browsing behavior through cookies and similar technologies.',
        'We may also collect information from third-party services, such as social media platforms if you choose to connect your account.',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To process and fulfill your orders, including sending you order confirmations and shipping updates.',
        'To communicate with you about your account, orders, products, services, and promotional offers.',
        'To improve our website, products, and services based on your feedback and usage patterns.',
        'To detect, prevent, and address technical issues, fraud, or security threats.',
        'To comply with legal obligations and protect our rights and the rights of our users.',
      ],
    },
    {
      title: 'Information Sharing',
      content: [
        'We do not sell, trade, or rent your personal information to third parties for their marketing purposes.',
        'We may share your information with trusted service providers who assist us in operating our website, processing payments, shipping orders, and conducting business activities.',
        'We may disclose your information if required by law, court order, or governmental authority, or to protect our rights, property, or safety.',
        'In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.',
      ],
    },
    {
      title: 'Data Security',
      content: [
        'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
        'We use encryption technology (SSL) to protect sensitive information transmitted over the internet.',
        'However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.',
        'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
      ],
    },
    {
      title: 'Cookies and Tracking Technologies',
      content: [
        'We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content.',
        'You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our website.',
        'We may use third-party analytics services, such as Google Analytics, to help us understand how visitors use our website.',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'You have the right to access, update, or delete your personal information at any time through your account settings.',
        'You can opt-out of marketing communications by clicking the unsubscribe link in our emails or contacting us directly.',
        'You may request a copy of your personal data or request that we restrict or object to certain processing activities.',
        'If you have concerns about how we handle your data, you can contact us or file a complaint with the relevant data protection authority.',
      ],
    },
    {
      title: 'Children\'s Privacy',
      content: [
        'Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.',
        'If we become aware that we have collected personal information from a child under 13, we will take steps to delete that information immediately.',
        'If you are a parent or guardian and believe your child has provided us with personal information, please contact us.',
      ],
    },
    {
      title: 'Changes to This Policy',
      content: [
        'We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.',
        'We will notify you of any material changes by posting the updated policy on this page and updating the "Last Updated" date.',
        'Your continued use of our website after any changes constitutes your acceptance of the updated Privacy Policy.',
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-2">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-gray-600">
            At E-Store, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <span className="text-primary-600 mt-1">•</span>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
            please contact us:
          </p>
          <div className="space-y-2 text-gray-700">
            <p><strong>Email:</strong> privacy@estore.com</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Commerce Street, Business City, BC 12345, United States</p>
          </div>
        </div>
      </div>
  );
};

export default PrivacyPolicy;

