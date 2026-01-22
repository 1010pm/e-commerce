# 🔐 كيفية تفعيل صلاحيات Admin

للدخول كـ **Admin** في المشروع، تحتاج إلى تغيير `role` للمستخدم من `'user'` إلى `'admin'` في Firestore.

---

## ✅ الطريقة الأولى: من Firebase Console (سهلة)

### الخطوات:

1. **افتح Firebase Console**
   - اذهب إلى: https://console.firebase.google.com/
   - اختر مشروعك: `e-commerce-68ee4`

2. **افتح Firestore Database**
   - من القائمة الجانبية: **Firestore Database**
   - اضغط على **Data** tab

3. **ابحث عن مستند المستخدم**
   - Collection: `users`
   - افتح المستند الذي يطابق `uid` المستخدم الذي تريد جعله admin

4. **عدّل الـ role**
   - اضغط على Field: `role`
   - غيّر القيمة من `user` إلى `admin`
   - اضغط **Update**

5. **تسجيل الدخول مرة أخرى**
   - اخرج من التطبيق
   - سجّل الدخول مرة أخرى
   - الآن يمكنك الدخول إلى `/admin/dashboard`

---

## ⚡ الطريقة الثانية: استخدام Script (أسرع)

إذا كنت تريد طريقة أسرع، يمكنك استخدام هذا السكريبت:

### 1. أنشئ ملف `scripts/make-admin.js`:

```javascript
/**
 * Script to make a user admin
 * Usage: node scripts/make-admin.js <user-email>
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // تحتاج هذا الملف

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const email = process.argv[2];

if (!email) {
  console.error('❌ يرجى إدخال البريد الإلكتروني: node scripts/make-admin.js user@example.com');
  process.exit(1);
}

async function makeAdmin() {
  try {
    // البحث عن المستخدم بالبريد الإلكتروني
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.error(`❌ لم يتم العثور على مستخدم بالبريد: ${email}`);
      process.exit(1);
    }
    
    snapshot.forEach(async (doc) => {
      await doc.ref.update({ role: 'admin' });
      console.log(`✅ تم تفعيل صلاحيات Admin للمستخدم: ${email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
    process.exit(1);
  }
}

makeAdmin();
```

### 2. أو استخدم Firebase CLI (أسهل):

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# استخدام Firestore في Terminal
firebase firestore:get users/<USER_UID>
firebase firestore:set users/<USER_UID> role admin
```

---

## 🔍 طريقة سريعة: من Console المطور

1. **افتح التطبيق في المتصفح**
2. **افتح Developer Console** (F12)
3. **سجّل الدخول بحسابك**
4. **في Console اكتب:**

```javascript
// احصل على UID الخاص بك
import { auth } from './src/config/firebase.config';
console.log('Your UID:', auth.currentUser?.uid);

// ثم اذهب إلى Firebase Console وعدّل الـ role يدوياً
```

---

## 📝 ملاحظات مهمة:

- ✅ بعد تغيير `role` إلى `admin`، يجب **تسجيل الخروج والدخول مرة أخرى**
- ✅ URL لوحة الإدارة: `/admin/dashboard`
- ✅ يمكنك التحقق من صلاحياتك في Redux DevTools: `state.auth.isAdmin`
- ⚠️ **أمان**: تأكد من أن Firestore Rules تمنع المستخدمين العاديين من تغيير `role` بأنفسهم

---

## 🎯 التحقق من أنك Admin:

بعد تسجيل الدخول، افتح Developer Console واكتب:

```javascript
// في Redux DevTools
state.auth.isAdmin // يجب أن يكون true
state.auth.userData.role // يجب أن يكون 'admin'
```

---

## 🚨 إذا لم يعمل:

1. ✅ تأكد أنك سجلت الخروج والدخول مرة أخرى
2. ✅ تحقق من Firestore Console أن `role` تم تغييره بالفعل
3. ✅ تأكد من أن الـ `uid` في Firestore يطابق `uid` في Authentication
4. ✅ افتح Network tab وتحقق من أن البيانات يتم جلبها بشكل صحيح

---

**جاهز! الآن يمكنك الدخول إلى `/admin/dashboard` 🚀**
