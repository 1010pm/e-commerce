# 🛍️ E-Commerce Platform - Production Ready

موقع تجارة إلكترونية احترافي مبني بـ React.js و Firebase - جاهز للإنتاج

## ✨ المميزات الرئيسية

### للعملاء (Customer Side)
- 🏠 **الصفحة الرئيسية** - عرض المنتجات المميزة والفئات والعروض
- 🛍️ **صفحة المنتجات** - تصفح مع فلترة وترتيب وبحث متقدم
- 📦 **تفاصيل المنتج** - عرض شامل مع صور متعددة وتقييمات
- 🛒 **السلة** - إدارة مشترياتك بسهولة
- 💳 **الدفع** - عملية دفع آمنة ومريحة
- 👤 **الملف الشخصي** - إدارة معلوماتك الشخصية
- 📋 **الطلبات** - تتبع طلباتك السابقة
- 🔐 **المصادقة** - تسجيل دخول/تسجيل حساب مع Google OAuth

### للإدارة (Admin Dashboard)
- 📊 **لوحة التحكم الرئيسية** - إحصائيات شاملة و KPIs
- 📦 **إدارة المنتجات** - إضافة/تعديل/حذف المنتجات
- 🏷️ **إدارة الفئات** - تنظيم المنتجات حسب الفئات
- 📋 **إدارة الطلبات** - متابعة وتحديث حالة الطلبات
- 👥 **إدارة المستخدمين** - عرض وإدارة حسابات المستخدمين
- 📦 **إدارة المخزون** - تتبع وتحديث مستويات المخزون

### تقنيات وتصميم
- ⚡ **Performance Optimized** - Lazy Loading, Code Splitting, Memoization
- 📱 **Responsive Design** - يعمل على جميع الأجهزة
- 🎨 **Modern UI/UX** - تصميم عصري وجذاب
- ♿ **Accessible** - يدعم Accessibility Basics
- 🌙 **Dark Mode Ready** - جاهز للوضع الداكن
- 🔒 **Secure** - Firebase Security Rules محكمة

## 🚀 البدء السريع

### المتطلبات
- Node.js 16+ و npm/yarn
- حساب Firebase مع مشروع جديد

### التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd e-commerce
```

2. **تثبيت المكتبات**
```bash
npm install
```

3. **إعداد Firebase**
   - أنشئ مشروع جديد في [Firebase Console](https://console.firebase.google.com/)
   - احصل على Firebase Configuration
   - أنشئ ملف `.env` في المجلد الرئيسي:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. **إعداد Firestore Rules**
   - انسخ محتوى ملف `firestore.rules` إلى Firebase Console
   - في Firebase Console: Firestore Database → Rules → الصق القواعد

5. **تشغيل التطبيق**
```bash
npm start
```
التطبيق سيعمل على `http://localhost:3000`

## 📁 هيكل المشروع

```
e-commerce/
├── public/                 # الملفات العامة
├── src/
│   ├── components/         # المكونات القابلة لإعادة الاستخدام
│   │   ├── common/        # مكونات UI عامة (Button, Input, Modal, etc.)
│   │   ├── features/      # مكونات مخصصة (ProductCard, etc.)
│   │   └── layout/        # مكونات التخطيط (Header, Footer)
│   ├── pages/             # صفحات التطبيق
│   │   ├── auth/         # صفحات المصادقة
│   │   ├── admin/        # صفحات لوحة الإدارة
│   │   └── ...           # صفحات العميل
│   ├── layouts/          # قوالب التطبيق
│   ├── hooks/            # Custom Hooks
│   ├── services/         # خدمات Firebase
│   ├── store/            # Redux Store
│   │   └── slices/       # Redux Slices
│   ├── utils/            # دوال مساعدة
│   ├── constants/        # الثوابت
│   ├── config/           # إعدادات Firebase
│   └── App.js            # المكون الرئيسي
├── .env.example          # مثال ملف البيئة
├── firestore.rules       # قواعد Firestore Security
└── README.md             # هذا الملف
```

## 🗄️ هيكل قاعدة البيانات (Firestore)

### Collections

#### `users`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  role: 'user' | 'admin',
  phone: string,
  address: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `products`
```javascript
{
  name: string,
  description: string,
  price: number,
  originalPrice: number,  // optional
  category: string,
  images: string[],
  stock: number,
  inStock: boolean,
  rating: number,
  reviewsCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `categories`
```javascript
{
  name: string,
  description: string,
  image: string,  // optional
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `orders`
```javascript
{
  userId: string,
  items: array,
  shippingAddress: object,
  paymentMethod: string,
  subtotal: number,
  tax: number,
  shipping: number,
  total: number,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `carts`
```javascript
{
  userId: string,
  items: array,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔐 إعداد المستخدم الإداري

لإنشاء مستخدم إداري:

1. سجّل حساب جديد عادي من الموقع
2. افتح Firebase Console → Firestore Database
3. اذهب إلى collection `users`
4. ابحث عن مستند المستخدم الجديد
5. غيّر قيمة `role` من `'user'` إلى `'admin'`
6. احفظ التغييرات

الآن يمكنك الوصول إلى لوحة الإدارة من القائمة المنسدلة في Header

## 🛠️ Scripts المتاحة

```bash
npm start          # تشغيل التطبيق في وضع التطوير
npm run build      # بناء التطبيق للإنتاج
npm test           # تشغيل الاختبارات
npm run eject      # إخراج إعدادات Create React App (غير موصى به)
```

## 📦 بناء للإنتاج

```bash
npm run build
```

الملفات المبنية ستكون في مجلد `build/`

### النشر على Firebase Hosting

1. **تثبيت Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **تسجيل الدخول**
```bash
firebase login
```

3. **تهيئة المشروع**
```bash
firebase init hosting
```

4. **النشر**
```bash
npm run build
firebase deploy --only hosting
```

## 🎨 Design System

### الألوان
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Purple (#d946ef)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Gray**: Shades of gray for text and backgrounds

### Typography
- **Font Family**: Inter (English), Cairo (Arabic)
- **Sizes**: Responsive scale from 0.875rem to 3rem

### Spacing
- **Scale**: 0.25rem increments (0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32)

## 🔧 الإعدادات المتقدمة

### إضافة دعم اللغات (Multi-Language)
المشروع جاهز لإضافة دعم متعدد اللغات باستخدام مكتبة مثل `react-i18next`

### إضافة Dark Mode
المشروع جاهز للوضع الداكن - يمكن تفعيله بإضافة `dark` class إلى `<html>` tag

### إضافة Payment Gateway
يمكن إضافة Stripe أو PayPal في صفحة Checkout

## 📝 ملاحظات مهمة

1. **Security Rules**: تأكد من نشر `firestore.rules` بشكل صحيح في Firebase Console
2. **Environment Variables**: لا تشارك ملف `.env` أبداً
3. **Firebase Storage**: تأكد من إعداد Storage Rules في Firebase Console
4. **CORS**: تأكد من إعداد CORS بشكل صحيح إذا كنت تستخدم Cloud Functions

## 🤝 المساهمة

نرحب بجميع المساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. Commit التغييرات
4. Push إلى Branch
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام التجاري.

## 👨‍💻 المطور

تم تطويره بواسطة Senior Full-Stack Engineer

## 🙏 الشكر

شكراً لاستخدام هذا المشروع! إذا كان مفيداً، لا تنسى ⭐ المشروع

---

**ملاحظة**: هذا المشروع جاهز للإنتاج ويمكن استخدامه مباشرة بعد إعداد Firebase. جميع المكونات والوظائف الأساسية متوفرة وجاهزة للاستخدام.
