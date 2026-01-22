/**
 * Products Management Page
 * صفحة إدارة المنتجات
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../store/slices/productsSlice';
import { uploadImage, uploadMultipleImages } from '../../services/storage';
import { formatCurrency } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Spinner } from '../../components/common/Loading';
import { validateImageFile } from '../../utils/validators';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProductsManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    images: [],
    category: '',
    inStock: true,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 100 } }));
  }, [dispatch]);

  useEffect(() => {
    if (id && products.length > 0) {
      const product = products.find((p) => p.id === id);
      if (product) {
        setSelectedProduct(product);
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          category: product.category || '',
          stock: product.stock || '',
          images: product.images || [],
          inStock: product.inStock !== undefined ? product.inStock : true,
        });
        setModalOpen(true);
      }
    }
  }, [id, products]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join(', '));
    }

    setImageFiles(validFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload images if any
      let imageUrls = formData.images || [];
      if (imageFiles.length > 0) {
        const uploadResult = await uploadMultipleImages(imageFiles, 'products');
        if (uploadResult.success) {
          imageUrls = [...imageUrls, ...uploadResult.urls];
        } else {
          toast.error('Failed to upload images');
          setUploading(false);
          return;
        }
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: parseInt(formData.stock) || 0,
        images: imageUrls,
      };

      if (selectedProduct) {
        // Update product
        const result = await dispatch(
          updateProduct({ id: selectedProduct.id, productData })
        );
        if (updateProduct.fulfilled.match(result)) {
          toast.success('Product updated successfully!');
          handleCloseModal();
        } else {
          toast.error('Failed to update product');
        }
      } else {
        // Create product
        const result = await dispatch(createProduct(productData));
        if (createProduct.fulfilled.match(result)) {
          toast.success('Product created successfully!');
          handleCloseModal();
        } else {
          toast.error('Failed to create product');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    const result = await dispatch(deleteProduct(selectedProduct.id));
    if (deleteProduct.fulfilled.match(result)) {
      toast.success('Product deleted successfully!');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } else {
      toast.error('Failed to delete product');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      stock: '',
      images: [],
      inStock: true,
    });
    setImageFiles([]);
    if (id) {
      navigate(ROUTES.ADMIN_PRODUCTS);
    }
  };

  const handleEdit = (product) => {
    navigate(`${ROUTES.ADMIN_PRODUCTS_EDIT.replace(':id', product.id)}`);
  };

  const handleAdd = () => {
    navigate(ROUTES.ADMIN_PRODUCTS_ADD);
    setModalOpen(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products Management</h1>
          <p className="text-gray-600">Manage your products inventory</p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </Button>
      </div>

      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.images?.[0] || product.image || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="h-10 w-10 object-cover rounded mr-3"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          {product.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.inStock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-900 p-2"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen || !!id}
        onClose={handleCloseModal}
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <Input
              label="Original Price (optional)"
              name="originalPrice"
              type="number"
              step="0.01"
              value={formData.originalPrice}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <Input
              label="Stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="input-field"
            />
            <p className="mt-1 text-sm text-gray-500">
              Select one or more images (max 5MB each, JPEG/PNG/WebP)
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="inStock"
              id="inStock"
              checked={formData.inStock}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
              In Stock
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" loading={uploading} fullWidth>
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product"
        size="md"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
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


export default ProductsManagement;

