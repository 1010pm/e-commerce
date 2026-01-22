/**
 * Contact Us Page
 * صفحة اتصل بنا
 */

import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validateForm } from '../utils/validators';
import toast from 'react-hot-toast';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm(formData, {
      name: {
        required: true,
        requiredMessage: 'Name is required',
        minLength: 2,
        minLengthMessage: 'Name must be at least 2 characters',
      },
      email: {
        required: true,
        requiredMessage: 'Email is required',
        email: true,
        emailMessage: 'Invalid email address',
      },
      subject: {
        required: true,
        requiredMessage: 'Subject is required',
      },
      message: {
        required: true,
        requiredMessage: 'Message is required',
        minLength: 10,
        minLengthMessage: 'Message must be at least 10 characters',
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      // TODO: Integrate with email service or backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <EnvelopeIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">support@estore.com</p>
                  <p className="text-gray-600">info@estore.com</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <PhoneIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-gray-600">Mon-Fri: 9am-6pm</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <MapPinIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="text-gray-600">
                    123 Commerce Street<br />
                    Business City, BC 12345<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    placeholder="John Doe"
                  />

                  <Input
                    label="Your Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    placeholder="john@example.com"
                  />
                </div>

                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  required
                  placeholder="How can we help?"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`input-field ${errors.message ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Tell us more about your inquiry..."
                    required
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button type="submit" loading={loading} size="lg" fullWidth>
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ContactUs;

