/**
 * Inventory Management Page
 * صفحة إدارة المخزون
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, updateProduct } from '../../store/slices/productsSlice';
import { formatCurrency } from '../../utils/helpers';
import { Spinner } from '../../components/common/Loading';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 100 } }));
  }, [dispatch]);

  const updateStock = async (productId, newStock) => {
    const result = await dispatch(
      updateProduct({ id: productId, productData: { stock: parseInt(newStock), inStock: parseInt(newStock) > 0 } })
    );
    if (updateProduct.fulfilled.match(result)) {
      toast.success('Stock updated successfully!');
    } else {
      toast.error('Failed to update stock');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage product stock levels</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={product.stock || 0}
                      onChange={(e) => updateStock(product.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => updateStock(product.id, (product.stock || 0) + 10)}
                      className="text-primary-600 hover:text-primary-700 mr-4"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => updateStock(product.id, Math.max(0, (product.stock || 0) - 10))}
                      className="text-red-600 hover:text-red-700"
                    >
                      -10
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;

