/**
 * TypeScript Type Definitions
 * تعريفات الأنواع للتطبيق
 */

// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface UserData extends User {
  phone?: string;
  address?: Address;
  preferences?: UserPreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  category: string;
  categoryId: string;
  brand?: string;
  sku: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  rating?: number;
  reviewsCount?: number;
  createdAt: Date | any;
  updatedAt: Date | any;
  featured?: boolean;
  tags?: string[];
  specifications?: Record<string, string>;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt';
  order: 'asc' | 'desc';
}

// Category Types
export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  order: number;
  active: boolean;
  createdAt: Date | any;
  updatedAt: Date | any;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: Date | any;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  updatedAt: Date | any;
}

// Order Types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash_on_delivery' | 'paypal';

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: Date | any;
  updatedAt: Date | any;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date | any;
  validUntil: Date | any;
  active: boolean;
  createdAt: Date | any;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: Date | any;
}

// UI Types
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Form Types
export interface FormErrors {
  [key: string]: string;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  loading: boolean;
  touched: Record<string, boolean>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Route Types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
  adminOnly?: boolean;
  title?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
}

