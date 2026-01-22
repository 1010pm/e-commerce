/**
 * Application Configuration
 * إعدادات التطبيق العامة
 */

export const APP_CONFIG = {
  name: 'E-Commerce Store',
  version: '1.0.0',
  description: 'Production-Ready E-Commerce Platform',
  
  // Pagination
  ITEMS_PER_PAGE: 12,
  
  // Cart
  MAX_CART_ITEMS: 100,
  
  // Image Upload
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // Currency
  CURRENCY: 'OMR',
  CURRENCY_SYMBOL: 'OMR',
  
  // Shipping
  FREE_SHIPPING_THRESHOLD: 100,
  SHIPPING_COST: 10,
  
  // Tax Rate
  TAX_RATE: 0.08, // 8%
  
  // Roles
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },
  
  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },
  
  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },
};

export default APP_CONFIG;

