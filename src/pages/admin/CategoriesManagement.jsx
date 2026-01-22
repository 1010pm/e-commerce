/**
 * Categories Management Page
 * صفحة إدارة الفئات
 */

import React, { useEffect, useState } from 'react';
import { categoriesService } from '../../services/firestore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Spinner } from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const result = await categoriesService.getAll();
    if (result.success) {
      setCategories(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = selectedCategory
      ? await categoriesService.update(selectedCategory.id, formData)
      : await categoriesService.create(formData);

    if (result.success) {
      toast.success(`Category ${selectedCategory ? 'updated' : 'created'} successfully!`);
      handleCloseModal();
      loadCategories();
    } else {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    const result = await categoriesService.delete(selectedCategory.id);
    if (result.success) {
      toast.success('Category deleted successfully!');
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      loadCategories();
    } else {
      toast.error('Failed to delete category');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setModalOpen(true);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-600 mb-4">{category.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 btn-primary text-sm py-2"
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
              >
                <TrashIcon className="h-4 w-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-field"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="submit" fullWidth>
              {selectedCategory ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Category"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{selectedCategory?.name}"?
        </p>
        <div className="flex gap-4">
          <Button variant="danger" onClick={handleDelete} fullWidth>
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} fullWidth>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;

