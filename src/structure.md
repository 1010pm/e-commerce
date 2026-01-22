# 📁 هيكل المشروع (Project Structure)

## 📂 المجلدات الرئيسية

### `/components` - مكونات قابلة لإعادة الاستخدام
- **UI Components**: مكونات واجهة المستخدم الأساسية (Buttons, Cards, Inputs, Modals)
- **Features Components**: مكونات مخصصة للوظائف (ProductCard, CartItem, OrderCard)
- **Layout Components**: مكونات التخطيط (Header, Footer, Sidebar, Container)

### `/pages` - صفحات التطبيق
- **Customer Pages**: صفحات العميل (Home, Products, ProductDetails, Cart, Checkout, Profile, Orders)
- **Auth Pages**: صفحات المصادقة (Login, Register, ForgotPassword)
- **Admin Pages**: صفحات الإدارة (Dashboard, ProductsManagement, OrdersManagement, UsersManagement)

### `/layouts` - قوالب التطبيق
- **MainLayout**: القالب الرئيسي للعملاء
- **AuthLayout**: قالب صفحات المصادقة
- **AdminLayout**: قالب لوحة الإدارة

### `/hooks` - Custom Hooks
- Hooks مخصصة لإدارة الحالة والمنطق (useAuth, useCart, useProducts, useLocalStorage)

### `/services` - خدمات Firebase
- **auth.js**: خدمات المصادقة
- **firestore.js**: خدمات قاعدة البيانات
- **storage.js**: خدمات التخزين
- **firebase.js**: إعداد Firebase

### `/store` - Redux Store
- **slices**: شرائح Redux (authSlice, productsSlice, cartSlice, adminSlice)
- **store.js**: إعداد Redux Store

### `/utils` - Utilities
- **helpers.js**: دوال مساعدة
- **validators.js**: دوال التحقق
- **formatters.js**: دوال التنسيق
- **constants.js**: الثوابت

### `/assets` - الموارد
- **images**: الصور
- **icons**: الأيقونات
- **fonts**: الخطوط

### `/routes` - التوجيه
- **AppRoutes.js**: مسارات التطبيق الرئيسية
- **AdminRoutes.js**: مسارات لوحة الإدارة

### `/constants` - الثوابت
- **config.js**: إعدادات التطبيق
- **routes.js**: مسارات ثابتة
- **messages.js**: الرسائل

