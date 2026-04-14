/**
 * Inventory Management Page - Premium Edition
 * Manage product stock levels with real-time updates and advanced features
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, updateProduct } from '../../store/slices/productsSlice';
import { formatCurrency } from '../../utils/helpers';
import { SkeletonTable } from '../../components/admin/SkeletonLoader';
import Badge from '../../components/admin/Badge';
import EmptyState from '../../components/admin/EmptyState';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  FunnelIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 100 } }));
  }, [dispatch]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchTerm, stockFilter]);

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }

    setFilteredProducts(filtered);
  };

  const updateStock = async (productId, newStock, productData) => {
    if (newStock < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setUpdatingId(productId);
    try {
      const result = await dispatch(
        updateProduct({
          id: productId,
          productData: {
            ...productData,
            stock: parseInt(newStock),
            inStock: parseInt(newStock) > 0,
          },
        })
      );

      if (updateProduct.fulfilled.match(result)) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-success-500" />
            <span>Stock updated successfully!</span>
          </div>
        );
      } else {
        throw new Error('Failed to update stock');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update stock');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickUpdate = (productId, change, productData) => {
    const currentStock = productData.stock || 0;
    const newStock = Math.max(0, currentStock + change);
    updateStock(productId, newStock, productData);
  };

  // Safe price formatter
  const getSafePrice = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'N/A';
    return formatCurrency(numPrice, 'OMR', 'OMR');
  };

  // Get stock status color
  const getStockStatus = (stock) => {
    const s = stock || 0;
    if (s === 0) return 'error';
    if (s <= 10) return 'warning';
    return 'success';
  };

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage product stock levels</p>
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage product stock levels in real-time</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value="all">All Products</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
            <p className="text-sm text-gray-600">Total Products</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {filteredProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length}
            </p>
            <p className="text-sm text-gray-600">Low Stock</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {filteredProducts.filter(p => (p.stock || 0) === 0).length}
            </p>
            <p className="text-sm text-gray-600">Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredProducts.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracki ng-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quick Adjust
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    {/* Product */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || product.image || '/placeholder-product.svg'}
                          alt={product.name}
                          className="h-10 w-10 object-cover rounded-lg"
                          onError={(e) => (e.target.src = '/placeholder-product.svg')}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {product.category || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {product.sku || 'N/A'}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {getSafePrice(product.price)}
                    </td>

                    {/* Current Stock Input */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={product.stock || 0}
                        onChange={(e) => updateStock(product.id, e.target.value, product)}
                        disabled={updatingId === product.id}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        status={getStockStatus(product.stock)}
                      >
                        {(product.stock || 0) === 0
                          ? 'Out of Stock'
                          : (product.stock || 0) <= 10
                          ? 'Low Stock'
                          : 'In Stock'}
                      </Badge>
                    </td>

                    {/* Quick Adjust Buttons */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickUpdate(product.id, -10, product)}
                          disabled={updatingId === product.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove 10 units"
                        >
                          <MinusIcon className="h-5 w-5 text-red-600 hover:text-red-700" />
                        </button>
                        <span className="text-xs font-medium text-gray-600 w-6 text-center">
                          ±10
                        </span>
                        <button
                          onClick={() => handleQuickUpdate(product.id, 10, product)}
                          disabled={updatingId === product.id}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add 10 units"
                        >
                          <PlusIcon className="h-5 w-5 text-green-600 hover:text-green-700" />
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
          icon="📦"
          title="No products found"
          description="Try adjusting your search or filter to find products"
        />
      )}
    </div>
  );
};

export default InventoryManagement;

