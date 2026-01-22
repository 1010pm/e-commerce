/**
 * Admin Dashboard Page
 * صفحة لوحة التحكم الرئيسية
 */

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts } from '../../store/slices/productsSlice';
import { ordersService, usersService } from '../../services/firestore';
import { formatCurrency } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Spinner } from '../../components/common/Loading';
import {
  ShoppingBagIcon,
  TruckIcon,
  UsersIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [stats, setStats] = React.useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = React.useState(true);

  useEffect(() => {
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 100 } }));
    loadStats();
  }, [dispatch]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // Get all orders for revenue calculation
      const ordersResult = await ordersService.getAll();
      const orders = ordersResult.success ? ordersResult.data : [];

      // Get all users
      const usersResult = await usersService.getAll();
      const users = usersResult.success ? usersResult.data : [];

      const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      link: ROUTES.ADMIN_PRODUCTS,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: TruckIcon,
      color: 'bg-green-500',
      link: ROUTES.ADMIN_ORDERS,
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-purple-500',
      link: ROUTES.ADMIN_USERS,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
    },
  ];

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to the admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
          );

          if (stat.link) {
            return (
              <Link key={index} to={stat.link}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  {content}
                </Card>
              </Link>
            );
          }

          return (
            <Card key={index} className="p-6">
              {content}
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to={ROUTES.ADMIN_PRODUCTS_ADD}>
            <Button variant="outline" fullWidth>
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              Add New Product
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_CATEGORIES}>
            <Button variant="outline" fullWidth>
              Manage Categories
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_ORDERS}>
            <Button variant="outline" fullWidth>
              <TruckIcon className="h-5 w-5 mr-2" />
              View Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Products</h2>
          <Link to={ROUTES.ADMIN_PRODUCTS}>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <Spinner />
          </div>
        ) : products.length > 0 ? (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.slice(0, 5).map((product) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No products found</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

