/**
 * Categories Management Page - Production Ready
 * صفحة إدارة الفئات - جاهزة للإنتاج
 */

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { categoriesService } from '../../services/firestore';
import { uploadImage, deleteImage } from '../../services/storage';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { createSlug } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Spinner } from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import {
  validateImageFile,
} from '../../utils/validators';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CategoriesManagement = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if same as current image
    if (selectedCategory?.imagePath && selectedCategory.imagePath.endsWith(file.name)) {
      toast.error('This image is already set for this category');
      return;
    }

    // Validate image file using central utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setImageFile(file);

    // Create preview
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
      // Only auto-generate slug for NEW categories
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

      // Handle image updates
      if (imageFile) {
        toast.loading('Processing category image...', { id: 'category-save' });

        // 1. Delete old image if it exists
        if (selectedCategory && oldImagePath) {
          await deleteImage(oldImagePath);
        }

        // 2. Upload new image
        // For new categories, we use the slug as a temporary ID for the folder if ID isn't available yet
        const folderId = selectedCategory?.id || createSlug(formData.name);
        const uploadResult = await uploadImage(imageFile, 'categories', folderId);

        if (uploadResult.success) {
          imageUrl = uploadResult.url;
          imagePath = uploadResult.path;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // 3. Prepare category data
      const categoryData = {
        name: formData.name.trim(),
        slug: formData.slug || createSlug(formData.name),
        description: formData.description.trim() || '',
        isActive: formData.isActive,
        imageUrl: imageUrl,
        ...(imagePath && { imagePath }),
      };

      // 4. Save to Firestore
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

    const toastId = toast.loading('Deleting category and related image...');
    setUploading(true);

    try {
      const result = await categoriesService.delete(selectedCategory.id);

      if (result.success) {
        toast.success('Deleted successfully', { id: toastId });
        setDeleteModalOpen(false);
        setSelectedCategory(null);
        loadCategories();
        // Refresh categories in Redux store for all users
        dispatch(fetchCategories(false)); // false = public view (active only)
      } else {
        toast.error(result.error || 'Failed to delete category', { id: toastId });
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('An unexpected error occurred', { id: toastId });
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

    // Set existing image preview
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
        toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully!`);
        loadCategories();
        dispatch(fetchCategories(false)); // Refresh public view
      } else {
        toast.error(result.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('An error occurred while updating the category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories Management</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="lg">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<PhotoIcon className="h-20 w-20 text-gray-400" />}
          title="No Categories Yet"
          message="Create your first category to organize your products"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${category.isActive ? 'border-gray-100' : 'border-gray-200 opacity-75'
                }`}
            >
              <div className="p-6">
                {/* Category Image/Icon */}
                <div className="flex items-center gap-4 mb-4">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-3xl ${category.imageUrl ? 'hidden' : ''
                      }`}
                  >
                    📦
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    {category.slug && (
                      <p className="text-xs text-gray-500 mt-1">/{category.slug}</p>
                    )}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => toggleActive(category)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${category.isActive
                      ? 'bg-success-50 text-success-700 hover:bg-success-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {category.isActive ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4" />
                        Inactive
                      </>
                    )}
                  </button>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 btn-primary text-sm py-2"
                    disabled={uploading}
                  >
                    <PencilIcon className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setDeleteModalOpen(true);
                    }}
                    className="flex-1 btn-outline text-sm py-2 text-red-600 border-red-600 hover:bg-red-50"
                    disabled={uploading}
                  >
                    <TrashIcon className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            name="name"
            value={formData.name}
            onChange={handleNameChange}
            required
            placeholder="e.g., Electronics, Clothing"
            disabled={uploading}
          />

          <Input
            label="Slug (URL-friendly)"
            name="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: createSlug(e.target.value) })}
            placeholder="auto-generated-from-name"
            helperText={!!selectedCategory ? "Slug cannot be changed after creation to maintain URL stability" : "URL-friendly version of the category name (auto-generated)"}
            disabled={uploading || !!selectedCategory}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-field"
              placeholder="Brief description of this category"
              disabled={uploading}
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
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={uploading}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <PhotoIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
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
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              disabled={uploading}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Category is active (visible to users)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              fullWidth
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {selectedCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                selectedCategory ? 'Update Category' : 'Create Category'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              fullWidth
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Category"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>"{selectedCategory?.name}"</strong>?
          <br />
          <span className="text-sm text-gray-500 mt-2 block">
            This action cannot be undone. The category image will also be deleted.
          </span>
        </p>
        <div className="flex gap-4">
          <Button
            variant="danger"
            onClick={handleDelete}
            fullWidth
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Category'
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpen(false)}
            fullWidth
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;
