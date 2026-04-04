/**
 * Address Form Component
 * Reusable component for managing user address information
 */

import React, { useState, useEffect } from 'react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const AddressForm = ({
  address = {
    addressLine: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  },
  onSave = null,
  onCancel = null,
  loading = false,
  error = null,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState(address);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update form when address prop changes
  useEffect(() => {
    setFormData(address);
    setErrors({});
    setTouched({});
  }, [address, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'addressLine':
        if (!value || value.trim() === '') {
          newErrors.addressLine = 'Address is required';
        } else if (value.length < 5) {
          newErrors.addressLine = 'Address must be at least 5 characters';
        } else if (value.length > 100) {
          newErrors.addressLine = 'Address must not exceed 100 characters';
        } else {
          delete newErrors.addressLine;
        }
        break;

      case 'city':
        if (!value || value.trim() === '') {
          newErrors.city = 'City is required';
        } else if (value.length < 2) {
          newErrors.city = 'City must be at least 2 characters';
        } else if (value.length > 50) {
          newErrors.city = 'City must not exceed 50 characters';
        } else {
          delete newErrors.city;
        }
        break;

      case 'state':
        if (value && value.length > 50) {
          newErrors.state = 'State must not exceed 50 characters';
        } else {
          delete newErrors.state;
        }
        break;

      case 'country':
        if (!value || value.trim() === '') {
          newErrors.country = 'Country is required';
        } else if (value.length < 2) {
          newErrors.country = 'Country must be at least 2 characters';
        } else if (value.length > 50) {
          newErrors.country = 'Country must not exceed 50 characters';
        } else {
          delete newErrors.country;
        }
        break;

      case 'zipCode':
        if (!value || value.trim() === '') {
          newErrors.zipCode = 'Postal code is required';
        } else if (!/^[A-Za-z0-9\s\-]*$/.test(value)) {
          newErrors.zipCode = 'Postal code contains invalid characters';
        } else if (value.length > 20) {
          newErrors.zipCode = 'Postal code must not exceed 20 characters';
        } else {
          delete newErrors.zipCode;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate all fields
    if (!formData.addressLine || formData.addressLine.trim() === '') {
      newErrors.addressLine = 'Address is required';
    } else if (formData.addressLine.length < 5) {
      newErrors.addressLine = 'Address must be at least 5 characters';
    }

    if (!formData.city || formData.city.trim() === '') {
      newErrors.city = 'City is required';
    }

    if (!formData.country || formData.country.trim() === '') {
      newErrors.country = 'Country is required';
    }

    if (!formData.zipCode || formData.zipCode.trim() === '') {
      newErrors.zipCode = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (onSave) {
      onSave(formData);
    }
  };

  const handleReset = () => {
    setFormData(address);
    setErrors({});
    setTouched({});
  };

  return (
    <div className="address-form bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Address' : 'Add Address'}
        </h3>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Address Line */}
        <div>
          <Input
            label="Street Address"
            name="addressLine"
            type="text"
            value={formData.addressLine}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.addressLine ? errors.addressLine : ''}
            placeholder="123 Main Street, Apt 4B"
            required
            disabled={loading}
            helperText="Include street number, name, and apartment/suite if applicable"
          />
        </div>

        {/* City and State Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="City"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.city ? errors.city : ''}
              placeholder="New York"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="State/Province"
              name="state"
              type="text"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.state ? errors.state : ''}
              placeholder="NY (optional)"
              disabled={loading}
            />
          </div>
        </div>

        {/* Country and Zip Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Country"
              name="country"
              type="text"
              value={formData.country}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.country ? errors.country : ''}
              placeholder="United States"
              required
              disabled={loading}
              list="countries"
            />
          </div>

          <div>
            <Input
              label="Postal Code"
              name="zipCode"
              type="text"
              value={formData.zipCode}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.zipCode ? errors.zipCode : ''}
              placeholder="10001"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            {isEditing ? 'Update Address' : 'Save Address'}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}

          {!onCancel && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* Common Countries Datalist */}
      <datalist id="countries">
        <option value="United States" />
        <option value="Canada" />
        <option value="United Kingdom" />
        <option value="Australia" />
        <option value="Germany" />
        <option value="France" />
        <option value="Japan" />
        <option value="India" />
        <option value="Mexico" />
        <option value="Brazil" />
        <option value="Saudi Arabia" />
        <option value="United Arab Emirates" />
        <option value="Singapore" />
        <option value="China" />
        <option value="South Korea" />
      </datalist>
    </div>
  );
};

export default AddressForm;
