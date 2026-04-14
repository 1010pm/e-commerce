/**
 * Categories Management Page - Premium Edition
 * Advanced category management with analytics, search, and modern UI
 * صفحة إدارة الفئات - إصدار متقدم
 */

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { categoriesService } from '../../services/firestore';
import { uploadImage, deleteImage } from '../../services/storage';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { createSlug } from '../../utils/helpers';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import EmptyState from '../../components/admin/EmptyState';
import { SkeletonTable } from '../../components/admin/SkeletonLoader';
import { validateImageFile } from '../../utils/validators';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const CategoriesManagement = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [oldImagePath, setOldImagePath] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    isActive: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, searchTerm, statusFilter]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await categoriesService.getAll();
      if (result.success) {
        setCategories(result.data);
      } else {
        toast.error(result.error || 'Failed to load categories');
      }
    } catch (error) {
      toast.error('An error occurred while loading categories');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((cat) =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((cat) => 
        statusFilter === 'active' ? cat.isActive : !cat.isActive
      );
    }

    // Sort alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredCategories(filtered);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setOldImagePath(null);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      ...(!selectedCategory ? { slug: createSlug(name) } : {}),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = selectedCategory?.imageUrl || '';
      let imagePath = selectedCategory?.imagePath || null;

      if (imageFile) {
        toast.loading('Processing category image...', { id: 'category-save' });

        if (selectedCategory && oldImagePath) {
          await deleteImage(oldImagePath);
        }

        const folderId = selectedCategory?.id || createSlug(formData.name);
        const uploadResult = await uploadImage(imageFile, 'categories', folderId);

        if (uploadResult.success) {
          imageUrl = uploadResult.url;
          imagePath = uploadResult.path;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      const categoryData = {
        name: formData.name.trim(),
        slug: formData.slug || createSlug(formData.name),
        description: formData.description.trim() || '',
        isActive: formData.isActive,
        imageUrl: imageUrl,
        ...(imagePath && { imagePath }),
      };

      const result = selectedCategory
        ? await categoriesService.update(selectedCategory.id, categoryData)
        : await categoriesService.create(categoryData);

      if (result.success) {
        toast.success(`Category ${selectedCategory ? 'updated' : 'created'} successfully!`, { id: 'category-save' });
        handleCloseModal();
        loadCategories();
        dispatch(fetchCategories(false));
      } else {
        throw new Error(result.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Save category error:', error);
      toast.error(error.message || 'An error occurred while saving the category', { id: 'category-save' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    const toastId = toast.loading('Deleting category...');
    setUploading(true);

    try {
      const result = await categoriesService.delete(selectedCategory.id);

      if (result.success) {
        toast.success('✅ Category deleted successfully', { id: toastId });
        setDeleteModalOpen(false);
        setSelectedCategory(null);
        loadCategories();
        dispatch(fetchCategories(false));
      } else {
        toast.error(result.error || 'Failed to delete category', { id: toastId });
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('❌ An unexpected error occurred', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '', slug: '', isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setOldImagePath(null);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      slug: category.slug || createSlug(category.name || ''),
      isActive: category.isActive !== undefined ? category.isActive : true,
    });

    if (category.imageUrl) {
      setImagePreview(category.imageUrl);
      setOldImagePath(category.imagePath || null);
    } else {
      setImagePreview(null);
      setOldImagePath(null);
    }

    setImageFile(null);
    setModalOpen(true);
  };

  const toggleActive = async (category) => {
    try {
      const result = await categoriesService.update(category.id, {
        isActive: !category.isActive,
      });

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            <span>Category {!category.isActive ? 'activated' : 'deactivated'}</span>
          </div>
        );
        loadCategories();
        dispatch(fetchCategories(false));
      } else {
        toast.error(result.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('An error occurred while updating the category');
    }
  };

  // Statistics
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive).length;
  const inactiveCategories = categories.filter(c => !c.isActive).length;

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setFormData({ name: '', description: '', slug: '', isActive: true });
            setImageFile(null);
            setImagePreview(null);
            setOldImagePath(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Category
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCategories}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TagIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeCategories}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{inactiveCategories}</p>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, slug or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid/Table */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Image Section */}
              <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-blue-100 overflow-hidden">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-4">
                {/* Name and Slug */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  {category.slug && (
                    <p className="text-xs text-gray-500 mt-1">/{category.slug}</p>
                  )}
                </div>

                {/* Description */}
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                )}

                {/* Status Badge */}
                <div className="mb-4">
                  <Badge status={category.isActive ? 'success' : 'warning'}>
                    {category.isActive ? '✓ Active' : '⊗ Inactive'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    disabled={uploading}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(category)}
                    disabled={uploading}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    <EyeIcon className="h-4 w-4" />
                    {category.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setDeleteModalOpen(true);
                    }}
                    disabled={uploading}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📁"
          title={searchTerm || statusFilter !== 'all' ? "No categories found" : "No categories yet"}
          description={searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filters" : "Create your first category to organize products"}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedCategory ? 'Edit Category' : 'Create New Category'}
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? 'Saving...' : selectedCategory ? 'Update' : 'Create'}
            </button>
          </div>
        }
      >
        <form className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g., Electronics, Clothing"
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug (URL-friendly)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: createSlug(e.target.value) })}
              placeholder="auto-generated-from-name"
              disabled={uploading || !!selectedCategory}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {selectedCategory ? 'Slug is locked after creation' : 'Auto-generated from name'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description (optional)"
              rows={3}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Image
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={uploading}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={uploading}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Make this category visible to customers
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Category"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">"{selectedCategory?.name}"</span>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">
              This action cannot be undone. The category image will also be deleted.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;
