# 🔧 حل مشكلة Admin Role

إذا غيرت الـ role إلى `admin` لكن التطبيق ما زال يعاملك كمستخدم عادي، جرب الخطوات التالية:

---

## ✅ الخطوات السريعة (جربها بالترتيب):

### 1️⃣ **تأكد أنك سجلت الخروج والدخول مرة أخرى**
هذا **أهم شيء** - البيانات يتم جلبها عند تسجيل الدخول:

```bash
# في التطبيق:
1. اضغط على Logout (أو اخرج من التطبيق)
2. سجل الدخول مرة أخرى
3. جرب /admin/dashboard
```

---

### 2️⃣ **تأكد من البيانات في Firestore Console**

1. اذهب إلى Firebase Console → Firestore Database
2. افتح collection `users`
3. افتح المستند (الـ UID الخاص بك)
4. **تأكد** من أن:
   - Field `role` موجود
   - قيمة `role` = `admin` (بدون علامات اقتباس إضافية)
   - الـ `uid` في المستند يطابق الـ UID في Authentication

---

### 3️⃣ **افتح Developer Console وفحص البيانات**

بعد تسجيل الدخول، افتح Developer Console (F12) واكتب:

```javascript
// إذا كان Redux متاح (يمكنك تثبيت Redux DevTools)
window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__

// أو استخدم هذا في Console:
// (بعد تسجيل الدخول)
```

أو افتح **Redux DevTools** في المتصفح:
- Chrome: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- Firefox: [Redux DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

ثم اذهب إلى:
- State → auth → userData
- تحقق من `role: "admin"`
- تحقق من `isAdmin: true`

---

### 4️⃣ **مسح Cache المتصفح**

إذا لم يعمل، جرب مسح cache المتصفح:

```bash
# في المتصفح:
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)

# أو:
1. افتح Developer Tools (F12)
2. اضغط بزر الماوس الأيمن على زر Refresh
3. اختر "Empty Cache and Hard Reload"
```

---

### 5️⃣ **تأكد من الـ UID**

**مهم جداً**: الـ UID في Firestore يجب أن يطابق الـ UID في Authentication:

1. Firebase Console → Authentication → Users
2. انسخ الـ UID
3. Firebase Console → Firestore → users collection
4. تأكد أن Document ID = الـ UID الذي نسخته

---

### 6️⃣ **فحص Network Requests**

1. افتح Developer Tools (F12)
2. اذهب إلى Network tab
3. سجل الدخول
4. ابحث عن requests إلى Firestore
5. تحقق من response - يجب أن يحتوي على `role: "admin"`

---

## 🛠️ حل بديل: تحديث البيانات يدوياً من Console

إذا لم يعمل، جرب هذا من Browser Console (بعد تسجيل الدخول):

```javascript
// افتح Console (F12) بعد تسجيل الدخول
// ثم انسخ والصق:

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './src/config/firebase.config';

const user = auth.currentUser;
if (user) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  console.log('Current user data:', userSnap.data());
  
  // تحديث role
  await updateDoc(userRef, { role: 'admin' });
  console.log('✅ Updated to admin');
  
  // إعادة تحميل الصفحة
  window.location.reload();
}
```

---

## 🔍 Debug Script (للتحقق)

أنشئ ملف `debug-admin.js` في مجلد `src`:

```javascript
import { auth, db } from './config/firebase.config';
import { doc, getDoc } from 'firebase/firestore';

export const debugAdmin = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ لا يوجد مستخدم مسجل دخول');
    return;
  }
  
  console.log('User UID:', user.uid);
  console.log('User Email:', user.email);
  
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    console.log('📄 User Data from Firestore:', data);
    console.log('Role:', data.role);
    console.log('Is Admin?', data.role === 'admin');
  } else {
    console.log('❌ لا يوجد مستند في Firestore لهذا المستخدم');
  }
};

// استخدمه في Console:
// debugAdmin()
```

---

## ❓ الأسئلة الشائعة

### Q: غيرت role لكن ما زال user?
**A:** تأكد من:
1. ✅ سجلت الخروج والدخول مرة أخرى
2. ✅ الـ UID في Firestore يطابق UID في Authentication
3. ✅ قيمة `role` = `admin` (نص، ليس object)

### Q: كيف أعرف UID الخاص بي?
**A:** 
- Firebase Console → Authentication → Users
- أو في Console: `auth.currentUser?.uid`

### Q: البيانات في Firestore صحيحة لكن التطبيق لا يقرأها?
**A:**
1. امسح cache المتصفح
2. سجل الخروج والدخول مرة أخرى
3. تحقق من Network requests
4. افتح Redux DevTools وتحقق من state

---

## 🚨 إذا لم يعمل بعد كل هذا:

1. تحقق من Firestore Security Rules - يجب أن تسمح للمستخدم بقراءة بياناته
2. تحقق من Console للأخطاء (F12 → Console)
3. تأكد أن Firebase config صحيح
4. جرب تسجيل حساب جديد وجعله admin مباشرة

---

**إذا استمرت المشكلة، أرسل لي:**
- Screenshot من Firestore (users collection)
- Screenshot من Redux DevTools (state.auth)
- أي أخطاء في Console
