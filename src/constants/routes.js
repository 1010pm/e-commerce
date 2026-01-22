/**
 * Application Routes Constants
 * جميع مسارات التطبيق
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAILS: '/products/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  
  // User Routes
  PROFILE: '/profile',
  ORDERS: '/orders',
  ORDER_DETAILS: '/orders/:id',
  WISHLIST: '/wishlist',
  
  // Information Pages
  CONTACT: '/contact',
  FAQ: '/faq',
  SHIPPING: '/shipping',
  RETURNS: '/returns',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
  
  // Admin Routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCTS_ADD: '/admin/products/add',
  ADMIN_PRODUCTS_EDIT: '/admin/products/edit/:id',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDERS_DETAILS: '/admin/orders/:id',
  ADMIN_USERS: '/admin/users',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_COUPONS: '/admin/coupons',
};

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.PRODUCTS,
  ROUTES.PRODUCT_DETAILS,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
];

export const PROTECTED_ROUTES = [
  ROUTES.CART,
  ROUTES.CHECKOUT,
  ROUTES.PROFILE,
  ROUTES.ORDERS,
  ROUTES.ORDER_DETAILS,
  ROUTES.WISHLIST,
];

export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.ADMIN_DASHBOARD,
  ROUTES.ADMIN_PRODUCTS,
  ROUTES.ADMIN_PRODUCTS_ADD,
  ROUTES.ADMIN_PRODUCTS_EDIT,
  ROUTES.ADMIN_CATEGORIES,
  ROUTES.ADMIN_ORDERS,
  ROUTES.ADMIN_ORDERS_DETAILS,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_INVENTORY,
  ROUTES.ADMIN_COUPONS,
];

