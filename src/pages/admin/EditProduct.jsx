/**
 * Edit Product - Multi-Step Form
 * Premium UX-first approach matching Add Product design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProduct, fetchProduct, clearProduct } from '../../store/slices/productsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { uploadMultipleImages, deleteImage } from '../../services/storage';
import { formatCurrency } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Spinner, PageLoader } from '../../components/common/Loading';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon,
    PhotoIcon,
    XMarkIcon,
    CurrencyDollarIcon,
    FolderIcon,
    DocumentTextIcon,
    SparklesIcon,
    ExclamationCircleIcon,
    TrashIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// Step configuration
const STEPS = [
    { id: 1, name: 'Basic Info', icon: DocumentTextIcon },
    { id: 2, name: 'Pricing', icon: CurrencyDollarIcon },
    { id: 3, name: 'Category', icon: FolderIcon },
    { id: 4, name: 'Images', icon: PhotoIcon },
    { id: 5, name: 'Review', icon: SparklesIcon },
];

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { product } = useSelector((state) => state.products);
    const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
    const { userData } = useSelector((state) => state.auth);

    // Loading state
    const [initialLoading, setInitialLoading] = useState(true);

    // Form state
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        fullDescription: '',
        price: '',
        enableDiscount: false,
        discountPercentage: '',
        categoryId: '',
        // Existing images from Firestore (URLs)
        existingImages: [],
        existingImagePaths: [],
        // New images to upload (File objects)
        newImages: [],
        newImagePreviews: [],
        // Images marked for deletion
        imagesToDelete: [],
    });

    // Validation errors
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Fetch product and categories on mount
    useEffect(() => {
        const loadData = async () => {
            setInitialLoading(true);
            await Promise.all([
                dispatch(fetchProduct(id)),
                dispatch(fetchCategories(true)),
            ]);
            setInitialLoading(false);
        };
        loadData();

        return () => {
            dispatch(clearProduct());
        };
    }, [dispatch, id]);

    // Populate form when product is loaded
    useEffect(() => {
        if (product && !initialLoading) {
            const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
            const originalPrice = hasDiscount
                ? (product.originalPrice || product.price / (1 - product.discountPercentage / 100))
                : product.price;

            setFormData({
                name: product.name || '',
                shortDescription: product.description || '',
                fullDescription: product.fullDescription || '',
                price: originalPrice?.toString() || '',
                enableDiscount: hasDiscount,
                discountPercentage: hasDiscount ? product.discountPercentage.toString() : '',
                categoryId: product.categoryId || '',
                existingImages: product.images || [],
                existingImagePaths: product.imagePaths || [],
                newImages: [],
                newImagePreviews: [],
                imagesToDelete: [],
            });
        }
    }, [product, initialLoading]);

    // Clean up new image previews on unmount
    useEffect(() => {
        return () => {
            formData.newImagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate prices
    const calculatedPrices = useMemo(() => {
        const price = parseFloat(formData.price) || 0;
        const discountPercent = formData.enableDiscount ? (parseFloat(formData.discountPercentage) || 0) : 0;
        const discountAmount = (price * discountPercent) / 100;
        const finalPrice = price - discountAmount;

        return {
            originalPrice: price,
            discountPercentage: discountPercent,
            discountAmount,
            finalPrice: Math.max(0, finalPrice),
        };
    }, [formData.price, formData.enableDiscount, formData.discountPercentage]);

    // Get selected category
    const selectedCategory = useMemo(() => {
        return categories.find(cat => cat.id === formData.categoryId);
    }, [categories, formData.categoryId]);

    // Active categories only
    const activeCategories = useMemo(() => {
        return categories.filter(cat => cat.isActive);
    }, [categories]);

    // All current images (existing + new previews, minus deleted)
    const allImages = useMemo(() => {
        const existing = formData.existingImages
            .filter((_, index) => !formData.imagesToDelete.includes(index))
            .map((url, index) => ({
                type: 'existing',
                url,
                originalIndex: formData.existingImages.indexOf(url),
            }));

        const newPreviews = formData.newImagePreviews.map((url, index) => ({
            type: 'new',
            url,
            newIndex: index,
        }));

        return [...existing, ...newPreviews];
    }, [formData.existingImages, formData.newImagePreviews, formData.imagesToDelete]);

    // Validation functions
    const validateStep = useCallback((step) => {
        const newErrors = {};

        switch (step) {
            case 1:
                if (!formData.name.trim()) {
                    newErrors.name = 'Product name is required';
                } else if (formData.name.trim().length < 3) {
                    newErrors.name = 'Product name must be at least 3 characters';
                }
                if (!formData.shortDescription.trim()) {
                    newErrors.shortDescription = 'Short description is required';
                } else if (formData.shortDescription.length > 120) {
                    newErrors.shortDescription = 'Short description must be 120 characters or less';
                }
                break;

            case 2:
                if (!formData.price || parseFloat(formData.price) <= 0) {
                    newErrors.price = 'Price must be greater than 0';
                }
                if (formData.enableDiscount) {
                    const discount = parseFloat(formData.discountPercentage);
                    if (!discount || discount < 1 || discount > 90) {
                        newErrors.discountPercentage = 'Discount must be between 1% and 90%';
                    }
                }
                break;

            case 3:
                if (!formData.categoryId) {
                    newErrors.categoryId = 'Please select a category';
                } else {
                    const category = categories.find(c => c.id === formData.categoryId);
                    if (!category || !category.isActive) {
                        newErrors.categoryId = 'Selected category is not available';
                    }
                }
                break;

            case 4:
                if (allImages.length === 0) {
                    newErrors.images = 'At least one product image is required';
                }
                break;

            default:
                break;
        }

        return newErrors;
    }, [formData, categories, allImages.length]);

    // Check if step is valid
    const isStepValid = useCallback((step) => {
        const stepErrors = validateStep(step);
        return Object.keys(stepErrors).length === 0;
    }, [validateStep]);

    // Check if can proceed
    const canProceed = useMemo(() => {
        return isStepValid(currentStep);
    }, [currentStep, isStepValid]);

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
            ...(name === 'enableDiscount' && !checked ? { discountPercentage: '' } : {}),
        }));

        setTouched(prev => ({ ...prev, [name]: true }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle blur for validation
    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        const stepErrors = validateStep(currentStep);
        if (stepErrors[name]) {
            setErrors(prev => ({ ...prev, [name]: stepErrors[name] }));
        }
    };

    // Handle new image upload
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const currentCount = allImages.length;
        const remainingSlots = MAX_IMAGES - currentCount;

        if (remainingSlots <= 0) {
            toast.error(`Maximum ${MAX_IMAGES} images allowed`);
            return;
        }

        const filesToAdd = files.slice(0, remainingSlots);
        const validFiles = [];
        const previews = [];

        filesToAdd.forEach(file => {
            // Check for duplicates in new images
            const isDuplicateNew = formData.newImages.some(f => f.name === file.name && f.size === file.size);
            // Check for duplicates in existing images (by filename in path)
            const isDuplicateExisting = formData.existingImagePaths.some(path => path.endsWith(file.name));

            if (isDuplicateNew || isDuplicateExisting) {
                toast.error(`${file.name} is already added`);
                return;
            }

            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                toast.error(`${file.name}: Invalid file type. Use JPG, PNG, or WebP`);
                return;
            }

            if (file.size > MAX_IMAGE_SIZE) {
                toast.error(`${file.name}: File too large. Max size is 5MB`);
                return;
            }

            validFiles.push(file);
            previews.push(URL.createObjectURL(file));
        });

        if (validFiles.length > 0) {
            setFormData(prev => ({
                ...prev,
                newImages: [...prev.newImages, ...validFiles],
                newImagePreviews: [...prev.newImagePreviews, ...previews],
            }));

            setErrors(prev => ({ ...prev, images: null }));
        }

        e.target.value = '';
    };

    // Remove existing image (mark for deletion)
    const removeExistingImage = (originalIndex) => {
        setFormData(prev => ({
            ...prev,
            imagesToDelete: [...prev.imagesToDelete, originalIndex],
        }));
    };

    // Remove new image
    const removeNewImage = (newIndex) => {
        setFormData(prev => {
            URL.revokeObjectURL(prev.newImagePreviews[newIndex]);

            return {
                ...prev,
                newImages: prev.newImages.filter((_, i) => i !== newIndex),
                newImagePreviews: prev.newImagePreviews.filter((_, i) => i !== newIndex),
            };
        });
    };

    // Restore deleted existing image
    const restoreExistingImage = (originalIndex) => {
        setFormData(prev => ({
            ...prev,
            imagesToDelete: prev.imagesToDelete.filter(i => i !== originalIndex),
        }));
    };

    // Navigate steps
    const goToStep = (step) => {
        for (let i = 1; i < step; i++) {
            if (!isStepValid(i)) {
                toast.error(`Please complete Step ${i} first`);
                setCurrentStep(i);
                return;
            }
        }
        setCurrentStep(step);
    };

    const nextStep = () => {
        const stepErrors = validateStep(currentStep);

        if (Object.keys(stepErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...stepErrors }));
            Object.keys(stepErrors).forEach(key => {
                setTouched(prev => ({ ...prev, [key]: true }));
            });
            return;
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Submit form
    const handleSubmit = async () => {
        // Validate all steps
        for (let i = 1; i <= 4; i++) {
            const stepErrors = validateStep(i);
            if (Object.keys(stepErrors).length > 0) {
                setErrors(prev => ({ ...prev, ...stepErrors }));
                setCurrentStep(i);
                toast.error('Please complete all required fields');
                return;
            }
        }

        setIsSubmitting(true);
        setUploadProgress(10);

        try {
            // Check if images actually changed
            const imagesChanged = formData.newImages.length > 0 || formData.imagesToDelete.length > 0;

            let finalImages = [...formData.existingImages];
            let finalImagePaths = [...formData.existingImagePaths];

            if (imagesChanged) {
                toast.loading('Processing image changes...', { id: 'image-update' });

                // 1. Delete removed images from storage
                if (formData.imagesToDelete.length > 0) {
                    const deletePromises = formData.imagesToDelete.map(index => {
                        const path = formData.existingImagePaths[index];
                        return path ? deleteImage(path) : Promise.resolve({ success: true });
                    });

                    await Promise.all(deletePromises);

                    // Filter out deleted images from local arrays
                    finalImages = finalImages.filter((_, index) => !formData.imagesToDelete.includes(index));
                    finalImagePaths = finalImagePaths.filter((_, index) => !formData.imagesToDelete.includes(index));
                }

                setUploadProgress(40);

                // 2. Upload new images if any
                if (formData.newImages.length > 0) {
                    toast.loading('Uploading new images...', { id: 'image-update' });

                    // Use productId (id) for the path as requested: products/{productId}/{imageName}
                    const uploadResult = await uploadMultipleImages(formData.newImages, 'products', id);

                    if (!uploadResult.success) {
                        throw new Error(uploadResult.error || 'Failed to upload new images');
                    }

                    // Append new URLs and paths
                    finalImages = [...finalImages, ...uploadResult.urls];
                    finalImagePaths = [...finalImagePaths, ...uploadResult.paths];
                }

                toast.success('Images processed successfully', { id: 'image-update' });
            }

            setUploadProgress(70);
            toast.loading('Saving product data...', { id: 'save-product' });

            // 3. Prepare product data
            const productData = {
                name: formData.name.trim(),
                description: formData.shortDescription.trim(),
                fullDescription: formData.fullDescription.trim() || null,
                price: calculatedPrices.finalPrice,
                originalPrice: formData.enableDiscount ? calculatedPrices.originalPrice : null,
                discountPercentage: formData.enableDiscount ? calculatedPrices.discountPercentage : null,
                finalPrice: calculatedPrices.finalPrice,
                category: selectedCategory?.name || '',
                categoryId: formData.categoryId,
                images: finalImages,
                imagePaths: finalImagePaths,
                updatedBy: userData?.uid || null,
            };

            // 4. Update product in Firestore
            const result = await dispatch(updateProduct({ id, productData }));

            if (updateProduct.fulfilled.match(result)) {
                setUploadProgress(100);
                toast.success('Product updated successfully!', { id: 'save-product' });
                setShowSuccess(true);

                setTimeout(() => {
                    navigate(ROUTES.ADMIN_PRODUCTS);
                }, 2000);
            } else {
                throw new Error(result.payload || 'Failed to update product');
            }
        } catch (error) {
            console.error('Update product error:', error);
            toast.error(error.message || 'Failed to update product', { id: 'image-update' });
            toast.error(error.message || 'Error occurred during save', { id: 'save-product' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render step indicator
    const renderStepIndicator = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const isClickable = step.id <= currentStep || isStepValid(step.id - 1);

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => isClickable && goToStep(step.id)}
                                disabled={!isClickable}
                                className={`relative flex flex-col items-center group transition-all duration-300 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                                    }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                        ? 'bg-success-500 text-white shadow-lg shadow-success-500/30'
                                        : isActive
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-4 ring-primary-100'
                                            : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckIcon className="w-6 h-6" />
                                    ) : (
                                        <StepIcon className="w-6 h-6" />
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium transition-colors ${isActive
                                        ? 'text-primary-600'
                                        : isCompleted
                                            ? 'text-success-600'
                                            : 'text-gray-400'
                                        }`}
                                >
                                    {step.name}
                                </span>
                            </button>

                            {index < STEPS.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${currentStep > step.id
                                        ? 'bg-success-500'
                                        : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );

    // Render Step 1: Basic Info
    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                <p className="text-gray-500 mt-1">Update your product details</p>
            </div>

            <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && errors.name}
                placeholder="Enter product name"
                required
            />

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Short Description <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                    <textarea
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows={2}
                        maxLength={120}
                        placeholder="Brief description that appears in product cards"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 resize-none ${touched.shortDescription && errors.shortDescription
                            ? 'border-error-500 focus:ring-error-500'
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                            }`}
                    />
                    <span className={`absolute bottom-2 right-3 text-xs ${formData.shortDescription.length > 100 ? 'text-amber-500' : 'text-gray-400'
                        }`}>
                        {formData.shortDescription.length}/120
                    </span>
                </div>
                {touched.shortDescription && errors.shortDescription && (
                    <p className="mt-1.5 text-sm text-error-600 font-medium">{errors.shortDescription}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                    name="fullDescription"
                    value={formData.fullDescription}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Detailed product description with features, specifications, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none"
                />
            </div>
        </div>
    );

    // Render Step 2: Pricing
    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Pricing</h2>
                <p className="text-gray-500 mt-1">Update price and discount settings</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
                <Input
                    label="Price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.price && errors.price}
                    placeholder="0.00"
                    required
                />

                <div className="mt-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="enableDiscount"
                                checked={formData.enableDiscount}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors duration-200"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5 shadow-sm"></div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-900">Enable Discount</span>
                            <p className="text-sm text-gray-500">Apply a percentage discount to this product</p>
                        </div>
                    </label>
                </div>

                {formData.enableDiscount && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Discount Percentage
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="discountPercentage"
                                        value={formData.discountPercentage}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="1"
                                        max="90"
                                        placeholder="0"
                                        className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-all ${touched.discountPercentage && errors.discountPercentage
                                            ? 'border-error-500 focus:ring-error-500'
                                            : 'border-gray-300 focus:ring-primary-500'
                                            }`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                </div>
                                {touched.discountPercentage && errors.discountPercentage && (
                                    <p className="mt-1.5 text-sm text-error-600">{errors.discountPercentage}</p>
                                )}
                            </div>

                            <div className="flex gap-2 mt-6">
                                {[10, 20, 30, 50].map(preset => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, discountPercentage: preset.toString() }));
                                            setErrors(prev => ({ ...prev, discountPercentage: null }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${parseInt(formData.discountPercentage) === preset
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {preset}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {formData.price && parseFloat(formData.price) > 0 && (
                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-6 border border-primary-200">
                    <h3 className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-4">
                        Price Preview
                    </h3>
                    <div className="flex items-baseline gap-4">
                        <span className="text-3xl font-bold text-primary-900">
                            {formatCurrency(calculatedPrices.finalPrice)}
                        </span>
                        {formData.enableDiscount && calculatedPrices.discountPercentage > 0 && (
                            <>
                                <span className="text-lg text-gray-500 line-through">
                                    {formatCurrency(calculatedPrices.originalPrice)}
                                </span>
                                <span className="px-2.5 py-1 bg-success-500 text-white text-sm font-bold rounded-full">
                                    -{calculatedPrices.discountPercentage}%
                                </span>
                            </>
                        )}
                    </div>
                    {formData.enableDiscount && calculatedPrices.discountAmount > 0 && (
                        <p className="mt-2 text-sm text-primary-700">
                            Customer saves {formatCurrency(calculatedPrices.discountAmount)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    // Render Step 3: Category
    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Category</h2>
                <p className="text-gray-500 mt-1">Update the product category</p>
            </div>

            {categoriesLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : activeCategories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No categories available</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
                    >
                        Create Category
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {activeCategories.map(category => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                                setFormData(prev => ({ ...prev, categoryId: category.id }));
                                setErrors(prev => ({ ...prev, categoryId: null }));
                            }}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.categoryId === category.id
                                ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {category.imageUrl ? (
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    className="w-14 h-14 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-2xl">
                                    📦
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className={`font-semibold ${formData.categoryId === category.id ? 'text-primary-900' : 'text-gray-900'
                                    }`}>
                                    {category.name}
                                </h3>
                                {category.description && (
                                    <p className="text-sm text-gray-500 truncate">{category.description}</p>
                                )}
                            </div>
                            {formData.categoryId === category.id && (
                                <CheckCircleIcon className="w-6 h-6 text-primary-600 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {touched.categoryId && errors.categoryId && (
                <p className="text-sm text-error-600 font-medium flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.categoryId}
                </p>
            )}
        </div>
    );

    // Render Step 4: Images
    const renderStep4 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Product Images</h2>
                <p className="text-gray-500 mt-1">Manage product images (max {MAX_IMAGES})</p>
            </div>

            {/* Images marked for deletion */}
            {formData.imagesToDelete.length > 0 && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-4">
                    <h4 className="text-sm font-semibold text-error-800 mb-3 flex items-center gap-2">
                        <TrashIcon className="w-4 h-4" />
                        Images to be removed ({formData.imagesToDelete.length})
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                        {formData.imagesToDelete.map(index => (
                            <div key={index} className="relative group">
                                <img
                                    src={formData.existingImages[index]}
                                    alt={`To delete ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => restoreExistingImage(index)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div className="relative">
                <input
                    type="file"
                    id="imageUpload"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={allImages.length >= MAX_IMAGES}
                />
                <label
                    htmlFor="imageUpload"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all duration-200 ${allImages.length >= MAX_IMAGES
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer'
                        }`}
                >
                    <PlusIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-primary-600">Add more images</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, WebP (Max {MAX_IMAGE_SIZE / 1024 / 1024}MB each)
                    </p>
                    <p className="text-xs text-primary-600 mt-2 font-medium">
                        {allImages.length}/{MAX_IMAGES} images
                    </p>
                </label>
            </div>

            {/* Image Previews */}
            {allImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {allImages.map((image, index) => (
                        <div
                            key={`${image.type}-${image.type === 'existing' ? image.originalIndex : image.newIndex}`}
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all ${index === 0
                                ? 'border-primary-500 ring-2 ring-primary-500/20'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <img
                                src={image.url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-32 object-cover"
                            />

                            {/* Cover badge */}
                            {index === 0 && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded">
                                    Cover
                                </span>
                            )}

                            {/* Type badge */}
                            {image.type === 'new' && (
                                <span className="absolute top-2 right-2 px-2 py-0.5 bg-success-500 text-white text-xs font-bold rounded">
                                    New
                                </span>
                            )}

                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (image.type === 'existing') {
                                            removeExistingImage(image.originalIndex);
                                        } else {
                                            removeNewImage(image.newIndex);
                                        }
                                    }}
                                    className="p-2 bg-white rounded-full text-error-600 hover:bg-error-50 transition-colors"
                                    title="Remove image"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {touched.images && errors.images && (
                <p className="text-sm text-error-600 font-medium flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.images}
                </p>
            )}
        </div>
    );

    // Render Step 5: Review
    const renderStep5 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Review Changes</h2>
                <p className="text-gray-500 mt-1">Confirm your updates before saving</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        Updated Product Preview
                    </h3>
                </div>

                <div className="p-6">
                    {/* Images */}
                    <div className="flex gap-4 mb-6">
                        {allImages.length > 0 ? (
                            <>
                                <img
                                    src={allImages[0].url}
                                    alt="Product cover"
                                    className="w-32 h-32 rounded-xl object-cover border border-gray-200"
                                />
                                {allImages.length > 1 && (
                                    <div className="flex flex-col gap-2">
                                        {allImages.slice(1, 4).map((image, index) => (
                                            <img
                                                key={index}
                                                src={image.url}
                                                alt={`Product ${index + 2}`}
                                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                            />
                                        ))}
                                        {allImages.length > 4 && (
                                            <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                                                +{allImages.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center">
                                <PhotoIcon className="w-10 h-10 text-gray-300" />
                            </div>
                        )}

                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900">{formData.name || 'Product Name'}</h4>
                            <p className="text-sm text-gray-500 mt-1">{formData.shortDescription || 'Short description'}</p>

                            <div className="flex items-center gap-2 mt-3">
                                {selectedCategory && (
                                    <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                        {selectedCategory.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Final Price</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(calculatedPrices.finalPrice)}
                            </span>
                        </div>

                        {formData.enableDiscount && calculatedPrices.discountPercentage > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Original Price</span>
                                    <span className="text-gray-500 line-through">
                                        {formatCurrency(calculatedPrices.originalPrice)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-success-600">Discount</span>
                                    <span className="text-success-600 font-medium">
                                        -{calculatedPrices.discountPercentage}% (-{formatCurrency(calculatedPrices.discountAmount)})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Changes Summary */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Images</p>
                            <p className="font-semibold text-gray-900">
                                {allImages.length}
                                {formData.newImages.length > 0 && (
                                    <span className="text-success-600 text-sm ml-1">(+{formData.newImages.length} new)</span>
                                )}
                                {formData.imagesToDelete.length > 0 && (
                                    <span className="text-error-600 text-sm ml-1">(-{formData.imagesToDelete.length} removed)</span>
                                )}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                            <p className="font-semibold text-gray-900">{selectedCategory?.name || 'Not selected'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Loading state
    if (initialLoading) {
        return <PageLoader />;
    }

    // Product not found
    if (!product && !initialLoading) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <ExclamationCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                <p className="text-gray-500 mb-6">The product you're trying to edit doesn't exist.</p>
                <Button onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}>
                    Back to Products
                </Button>
            </div>
        );
    }

    // Success animation
    if (showSuccess) {
        return (
            <div className="min-h-[600px] flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircleIcon className="w-14 h-14 text-success-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Updated!</h2>
                    <p className="text-gray-500">Redirecting to products list...</p>
                    <Spinner className="mt-4" />
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Products
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-gray-500 mt-1">Update "{product?.name}" details</p>
            </div>

            {/* Progress indicator */}
            {renderStepIndicator()}

            {/* Form container */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                {/* Step content */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}

                {/* Upload progress */}
                {isSubmitting && uploadProgress > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Updating product...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 1 || isSubmitting}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back
                    </Button>

                    {currentStep < STEPS.length ? (
                        <Button
                            onClick={nextStep}
                            disabled={!canProceed || isSubmitting}
                            className="flex items-center gap-2"
                        >
                            Next
                            <ArrowRightIcon className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            className="flex items-center gap-2 px-8"
                        >
                            <CheckIcon className="w-5 h-5" />
                            Save Changes
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditProduct;
