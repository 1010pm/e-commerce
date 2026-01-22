/**
 * Terms of Service Page
 * صفحة شروط الخدمة
 */

import React from 'react';

const TermsOfService = () => {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.',
        'If you do not agree to abide by the above, please do not use this service.',
        'We reserve the right to modify these terms at any time without prior notice.',
      ],
    },
    {
      title: 'Use License',
      content: [
        'Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.',
        'This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to decompile or reverse engineer any software contained on our website; remove any copyright or other proprietary notations from the materials.',
        'This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.',
      ],
    },
    {
      title: 'Product Information and Pricing',
      content: [
        'We strive to provide accurate product descriptions, images, and pricing information. However, we do not warrant that product descriptions, images, or other content are accurate, complete, reliable, current, or error-free.',
        'Prices are subject to change without notice. We reserve the right to modify prices at any time.',
        'We are not responsible for typographical errors regarding price or any other matter.',
        'If a product is listed at an incorrect price due to a typographical error, we reserve the right to refuse or cancel any orders placed for the product listed at the incorrect price.',
      ],
    },
    {
      title: 'Orders and Payment',
      content: [
        'All orders are subject to product availability and our acceptance of your order.',
        'We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in pricing or product information, or suspected fraud.',
        'Payment must be received before we ship your order. We accept major credit cards and other payment methods as indicated on our website.',
        'You represent and warrant that you have the legal right to use any payment method you provide to us.',
      ],
    },
    {
      title: 'Shipping and Delivery',
      content: [
        'We will ship products according to the shipping method selected at checkout.',
        'Shipping times are estimates and are not guaranteed. We are not responsible for delays caused by shipping carriers or customs.',
        'Risk of loss and title for products purchased from us pass to you upon delivery to the carrier.',
        'You are responsible for filing any claims with carriers for damaged or lost shipments.',
      ],
    },
    {
      title: 'Returns and Refunds',
      content: [
        'Our return policy is detailed in our Returns page. Please review it before making a purchase.',
        'All returns must comply with our return policy, including time limitations, condition requirements, and proper authorization.',
        'Refunds will be processed according to our return policy and may take several business days to appear in your account.',
        'We reserve the right to refuse returns that do not meet our return policy requirements.',
      ],
    },
    {
      title: 'User Accounts',
      content: [
        'You are responsible for maintaining the confidentiality of your account and password.',
        'You agree to accept responsibility for all activities that occur under your account.',
        'You must immediately notify us of any unauthorized use of your account or any other breach of security.',
        'We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason we deem necessary.',
      ],
    },
    {
      title: 'Intellectual Property',
      content: [
        'All content on this website, including text, graphics, logos, images, and software, is the property of E-Store or its content suppliers and is protected by copyright and other intellectual property laws.',
        'You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.',
        'Trademarks, service marks, and logos displayed on our website are the property of their respective owners.',
      ],
    },
    {
      title: 'Prohibited Uses',
      content: [
        'You may not use our website for any unlawful purpose or to solicit others to perform unlawful acts.',
        'You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.',
        'You may not transmit any worms or viruses or any code of a destructive nature.',
        'You may not harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate.',
        'You may not submit false or misleading information or impersonate another person or entity.',
      ],
    },
    {
      title: 'Limitation of Liability',
      content: [
        'In no event shall E-Store, its directors, officers, employees, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our website or products.',
        'Our total liability to you for all claims arising from or related to the use of our website shall not exceed the amount you paid to us in the twelve months prior to the action giving rise to liability.',
        'Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so the above limitation may not apply to you.',
      ],
    },
    {
      title: 'Indemnification',
      content: [
        'You agree to defend, indemnify, and hold harmless E-Store and its affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney\'s fees) arising from your use of our website, your violation of these terms, or your violation of any third-party right.',
      ],
    },
    {
      title: 'Governing Law',
      content: [
        'These terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.',
        'Any disputes arising from these terms or your use of our website shall be resolved in the courts of the United States.',
      ],
    },
    {
      title: 'Changes to Terms',
      content: [
        'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website.',
        'Your continued use of our website after any changes constitutes your acceptance of the new terms.',
        'We encourage you to review these terms periodically to stay informed of any updates.',
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-2">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-gray-600">
            Please read these Terms of Service carefully before using our website. By accessing or using our service, 
            you agree to be bound by these terms. If you disagree with any part of these terms, then you may not access the service.
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Terms</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 text-gray-700">
            <p><strong>Email:</strong> legal@estore.com</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Commerce Street, Business City, BC 12345, United States</p>
          </div>
        </div>
      </div>
  );
};

export default TermsOfService;

