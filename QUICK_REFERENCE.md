# Quick Reference Guide - E-Commerce API

**Fast lookup for developers implementing features**

---

## 🚀 QUICK START

### Import Services
```javascript
import { ordersService } from '../services/ordersService';
import { cartService } from '../services/cartService';
import { checkoutService } from '../services/checkoutService';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
```

### Get Current User
```javascript
const { user } = useAuth();
// Returns: { uid, email, displayName, photoURL, ...}
```

---

## 📦 ORDERS API

### Get All User Orders
```javascript
const result = await ordersService.getAll(userId);
// result = { success: true, data: [...] }
```

### Get Single Order
```javascript
const result = await ordersService.getById(orderId, userId);
// Checks authorization - only owner or admin
```

### Create Order
```javascript
const result = await ordersService.create(userId, {
  items: [{ productId, name, price, quantity, image }],
  shippingAddress: { firstName, lastName, email, phone, addressLine, city, state, zipCode, country },
  paymentMethod: 'card',
  subtotal: 100,
  tax: 8,
  shipping: 10,
  total: 118
});
// Returns: { success, data: { id, ...orderData } }
```

### Update Order Status (Admin)
```javascript
const result = await ordersService.updateStatus(orderId, 'shipped');
// Statuses: pending, processing, shipped, delivered, cancelled
```

### Cancel Order
```javascript
const result = await ordersService.cancel(orderId, userId, 'Reason');
```

---

## 🛒 CART API

### Local Cart (Guest)
```javascript
const items = cartService.getLocalCart();
cartService.saveLocalCart(items);
cartService.clearLocalCart();
```

### Firestore Cart (User)
```javascript
const result = await cartService.getFromFirestore(userId);
await cartService.saveToFirestore(userId, items);
```

### Sync on Login
```javascript
const merged = await cartService.syncOnLogin(userId, guestCart);
// Merges guest cart with user's Firestore cart
```

### Calculate Totals
```javascript
const totals = cartService.calculateTotals(items);
// Returns: { subtotal, tax, shipping, total, itemCount }
```

---

## 🛍️ CHECKOUT API

### Validate Address
```javascript
const validation = checkoutService.validateShippingAddress(address);
if (!validation.valid) {
  console.log(validation.errors);
}
```

### Validate Payment
```javascript
const validation = checkoutService.validatePayment(payment);
```

### Prepare Order Data
```javascript
const orderData = checkoutService.prepareOrderData(data, userId);
await ordersService.create(userId, orderData);
```

---

## 👤 USER PROFILE API

### Get Profile
```javascript
const result = await getUserProfile(uid);
// Returns merged Firebase Auth + Firestore data
```

### Update Profile
```javascript
const result = await updateUserProfile(uid, {
  displayName: 'New Name',
  phoneNumber: '+1234567890',
  address: {
    addressLine: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  }
});
```

### Validate Phone
```javascript
const valid = validatePhoneNumber('+1234567890');
// Must be 7-15 digits
```

### Validate Address
```javascript
const validation = validateAddress(address);
if (!validation.valid) {
  console.log(validation.message);
}
```

---

## 📋 FIRESTORE SCHEMA

### orders/{orderId}
```javascript
{
  userId: "uid",
  items: [{ productId, name, price, quantity, image, subtotal }],
  shippingAddress: { firstName, lastName, email, phone, addressLine, city, state, zipCode, country },
  paymentMethod: "card|cash|bank_transfer",
  paymentStatus: "pending|completed|failed|refunded",
  subtotal: 100,
  tax: 8,
  shipping: 10,
  total: 118,
  status: "pending|processing|shipped|delivered|cancelled",
  notes: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### users/{userId}
```javascript
{
  uid: "userId",
  displayName: "John Doe",
  email: "john@example.com",
  phoneNumber: "+1234567890",
  photoURL: "url",
  address: { addressLine, city, state, country, zipCode },
  role: "user|admin",
  provider: "google|password",
  isActive: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### carts/{userId}
```javascript
{
  items: [
    { id, name, price, quantity, image, stock, category }
  ],
  updatedAt: serverTimestamp()
}
```

---

## 🔒 SECURITY RULES

| Action | Users | Products | Orders | Carts |
|--------|-------|----------|--------|-------|
| Read | Own only + Admin | Public | Own only + Admin | Own only |
| Create | Owner | Admin | Own userId | Owner |
| Update | Owner + Admin | Admin | Admin | Owner |
| Delete | Owner + Admin | Admin | Admin | Owner |

---

## 🎨 COMPONENT EXAMPLES

### Using Orders
```jsx
import { ordersService } from '../services/ordersService';
import { useAuth } from '../hooks/useAuth';

export function OrdersList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const result = await ordersService.getAll(user.uid);
      if (result.success) setOrders(result.data);
    };
    fetchOrders();
  }, [user.uid]);

  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### Using Checkout Service
```jsx
import { checkoutService } from '../services/checkoutService';

const handleCheckout = async (data) => {
  const validation = checkoutService.validateCheckoutData(data);
  if (!validation.valid) {
    setErrors(validation.errors);
    return;
  }

  const orderData = checkoutService.prepareOrderData(data, userId);
  const result = await ordersService.create(userId, orderData);
  
  if (result.success) {
    navigate(`/orders/${result.data.id}`);
  }
};
```

### Using Cart Service
```jsx
import { cartService } from '../services/cartService';

useEffect(() => {
  const syncCart = async () => {
    const merged = await cartService.syncOnLogin(userId, localCart);
    dispatch(setCart(merged));
    cartService.saveLocalCart(merged);
  };
  syncCart();
}, [userId]);
```

---

## ⚠️ IMPORTANT NOTES

1. **Always use `useAuth()` hook** - Gets the authenticated user
2. **userId required** - All order operations need userId
3. **Server timestamps** - Use `serverTimestamp()` for dates
4. **Validate before submit** - Client-side validation prevents errors
5. **Check authorization** - ordersService checks userId ownership
6. **Merge carts on login** - Guest cart syncs with user cart
7. **Security rules enforce** - Firestore rules filter data by userId

---

## 🐛 DEBUGGING TIPS

### Check User State
```javascript
const { user } = useAuth();
console.log('Current user:', user);
// If null, user is not authenticated
```

### Debug Order Query
```javascript
const result = await ordersService.getAll(userId);
console.log('Orders result:', result);
// Check if success is true before using data
```

### Validate Data Before Saving
```javascript
const validation = checkoutService.validateCheckoutData(data);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
  // Fix each validation error
}
```

---

## 📞 ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| `PERMISSION_DENIED` | Not authorized | Check userId matches |
| `NOT_FOUND` | Document not found | Verify orderId exists |
| `VALIDATION_FAILED` | Invalid data | Check validation errors |
| `NETWORK_ERROR` | Connection issue | Retry operation |

---

**Version**: 1.0.0  
**Last Updated**: April 3, 2026  
**For detailed info**: See IMPLEMENTATION_GUIDE.md
