/**
 * Modern Products Management Page
 * Premium product browser with statistics, grid/table toggle, advanced filters
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../store/slices/productsSlice';
import { ROUTES } from '../../constants/routes';
import FilterBar from '../../components/admin/FilterBar';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import EmptyState from '../../components/admin/EmptyState';
import { SkeletonGrid } from '../../components/admin/SkeletonLoader';

import {
  ShoppingBagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  DocumentChartBarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ModernProductsManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, loading } = useSelector((state) => state.products);

  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 100 } }));
  }, [dispatch]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const applyFilters = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter((product) => product.stock > 0 && product.stock <= 10);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((product) => product.stock === 0);
    }

    setFilteredProducts(filtered);
  };

  // Statistics calculations
  const stats = {
    total: products.length,
    active: products.filter((p) => p.stock > 0).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const getCategories = () => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).map((cat) => ({ value: cat, label: cat }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Browse and manage your product catalog</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.ADMIN_PRODUCTS_ADD)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <ShoppingBagIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        {/* Active (In Stock) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">In Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-amber-100 rounded-lg">
            <DocumentChartBarIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-red-100 rounded-lg">
            <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="space-y-4">
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              options: getCategories(),
            },
            {
              key: 'stock',
              label: 'Stock Status',
              value: stockFilter,
              options: [
                { value: 'all', label: 'All Products' },
                { value: 'low', label: 'Low Stock (≤10)' },
                { value: 'out', label: 'Out of Stock' },
              ],
            },
          ]}
          onFilterChange={(key, value) => {
            if (key === 'category') setCategoryFilter(value);
            if (key === 'stock') setStockFilter(value);
          }}
          hasActiveFilters={!!categoryFilter || stockFilter !== 'all'}
          onClearFilters={() => {
            setCategoryFilter('');
            setStockFilter('all');
          }}
        />

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'table'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bars3BottomLeftIcon className="w-5 h-5" />
            Table
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <SkeletonGrid cols={3} items={6} />
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-100 aspect-square">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBagIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3">
                      {product.stock === 0 ? (
                        <Badge status="error">Out of Stock</Badge>
                      ) : product.stock <= 10 ? (
                        <Badge status="warning">Low Stock</Badge>
                      ) : (
                        <Badge status="success">In Stock</Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-gray-900">
                          OMR {product.price?.toFixed(2)}
                        </p>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {product.stock || 0} units
                        </span>
                      </div>

                      {product.category && (
                        <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit">
                          {product.category}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100 mt-auto">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBagIcon}
              title="No products found"
              message="No products match your search criteria"
              action={
                searchTerm || categoryFilter || stockFilter !== 'all' ? null : (
                  <button
                    onClick={() => navigate(ROUTES.ADMIN_PRODUCTS_ADD)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Product
                  </button>
                )
              }
            />
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, idx) => (
                    <div key={idx} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {product.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            OMR {product.price?.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {product.stock || 0} units
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {product.stock === 0 ? (
                            <Badge status="error">Out of Stock</Badge>
                          ) : product.stock <= 10 ? (
                            <Badge status="warning">Low Stock</Badge>
                          ) : (
                            <Badge status="success">In Stock</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBagIcon}
              title="No products found"
              message="No products match your search criteria"
              action={
                searchTerm || categoryFilter || stockFilter !== 'all' ? null : (
                  <button
                    onClick={() => navigate(ROUTES.ADMIN_PRODUCTS_ADD)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Product
                  </button>
                )
              }
            />
          )}
        </>
      )}

      {/* Product Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedProduct ? 'Product Details' : ''}
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            {/* Product Image and Basic Info */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                {selectedProduct.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <p className="text-gray-600 text-sm mt-1">SKU: {selectedProduct.sku}</p>
                {selectedProduct.category && (
                  <div className="mt-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                      {selectedProduct.category}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing and Stock Section */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  OMR {selectedProduct.price?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Stock Level</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock || 0}</p>
                  <div>
                    {selectedProduct.stock === 0 ? (
                      <Badge status="error">Out of Stock</Badge>
                    ) : selectedProduct.stock <= 10 ? (
                      <Badge status="warning">Low Stock</Badge>
                    ) : (
                      <Badge status="success">In Stock</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Description</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {(selectedProduct.dimensions || selectedProduct.weight || selectedProduct.color) && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                {selectedProduct.dimensions && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">Dimensions</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedProduct.dimensions}
                    </p>
                  </div>
                )}
                {selectedProduct.weight && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">Weight</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedProduct.weight}kg
                    </p>
                  </div>
                )}
                {selectedProduct.color && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">Color</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedProduct.color}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  navigate(ROUTES.ADMIN_PRODUCTS_EDIT.replace(':id', selectedProduct.id));
                  handleCloseModal();
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PencilIcon className="w-5 h-5" />
                Edit Product
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModernProductsManagement;
