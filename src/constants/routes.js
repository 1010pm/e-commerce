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
  PAYMENT_SUCCESS: '/payment-success',
  PAYMENT_CANCEL: '/payment-cancel',
  PAYMENT_FAILED: '/payment-failed',
  
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  VERIFY_EMAIL_REQUIRED: '/verify-email-required', // Unverified users - only page they can access
  
  // User Routes
  PROFILE: '/profile',
  ORDERS: '/orders',
  ORDER_DETAILS: '/orders/:id',
  FAVORITES: '/favorites',
  WISHLIST: '/favorites', // Alias for FAVORITES
  
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
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_PAYMENTS_DETAILS: '/admin/payments/:id',
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
  ROUTES.PAYMENT_SUCCESS,
  ROUTES.PAYMENT_CANCEL,
  ROUTES.PAYMENT_FAILED,
  ROUTES.PROFILE,
  ROUTES.ORDERS,
  ROUTES.ORDER_DETAILS,
  ROUTES.FAVORITES,
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
  ROUTES.ADMIN_PAYMENTS,
  ROUTES.ADMIN_PAYMENTS_DETAILS,
];


