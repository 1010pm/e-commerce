# 🚀 Deployment Guide - Production Ready

## 📋 Overview

This guide covers deploying the E-Commerce application to Firebase Hosting in production.

---

## 🔐 Prerequisites

1. **Firebase CLI** installed globally:
```bash
npm install -g firebase-tools
```

2. **Firebase Account** with project created

3. **Firebase Project** configured

---

## 🚀 Step 1: Initialize Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Hosting
# - Firestore
# - Storage
# - Functions (optional)
```

---

## 🚀 Step 2: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in ./dist
```

---

## 🚀 Step 3: Configure Firebase Hosting

Create/Update `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## 🚀 Step 4: Set Environment Variables

### Option 1: Using .env.production

Create `.env.production`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

VITE_APP_ENV=production
VITE_APP_URL=https://your-domain.com
```

Build with production env:

```bash
npm run build
```

### Option 2: Using Firebase Functions (Recommended for sensitive data)

For sensitive config, use Firebase Functions or Secret Manager.

---

## 🚀 Step 5: Deploy

### Deploy Everything

```bash
# Deploy hosting, rules, and indexes
firebase deploy
```

### Deploy Specific Services

```bash
# Only hosting
firebase deploy --only hosting

# Only Firestore rules
firebase deploy --only firestore:rules

# Only Storage rules
firebase deploy --only storage:rules

# Only Functions (if using)
firebase deploy --only functions
```

---

## 🚀 Step 6: Custom Domain (Optional)

1. **Add Custom Domain in Firebase Console:**
   - Go to Firebase Console → Hosting
   - Click "Add custom domain"
   - Enter your domain

2. **Update DNS Records:**
   - Add A records provided by Firebase
   - Wait for SSL certificate (automatic)

3. **Update Environment Variables:**
   - Update `VITE_APP_URL` to your custom domain

---

## 🔒 Step 7: Security Checklist

### Firestore Rules

✅ Production-safe rules deployed  
✅ User data protected  
✅ Admin-only routes secured  
✅ Public read access for products  
✅ Write access restricted  

### Storage Rules

✅ User uploads restricted to own folder  
✅ Image size limits enforced  
✅ File type restrictions  
✅ Public read for product images  

### Environment Variables

✅ Never commit `.env.local`  
✅ Use `.env.production` for build  
✅ Sensitive data in Firebase Functions  

---

## 📊 Step 8: Monitoring & Analytics

### Enable Firebase Analytics

Already configured in code. Ensure:
- Analytics enabled in Firebase Console
- `VITE_FIREBASE_MEASUREMENT_ID` set

### Monitor Performance

1. **Firebase Performance Monitoring:**
   - Automatically tracks app performance
   - View in Firebase Console

2. **Firebase Crashlytics:**
   - Track crashes and errors
   - Get real-time alerts

### Set Up Alerts

1. **Firestore Usage Alerts**
2. **Storage Quota Alerts**
3. **Hosting Bandwidth Alerts**
4. **Function Execution Alerts**

---

## 🔄 Step 9: CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## 🧪 Step 10: Post-Deployment Testing

### Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Checkout process works
- [ ] Admin dashboard accessible
- [ ] Images load correctly
- [ ] Forms submit successfully
- [ ] Search and filters work
- [ ] Mobile responsive
- [ ] All routes accessible
- [ ] No console errors
- [ ] Performance acceptable (< 3s load time)

---

## 🔧 Troubleshooting

### Issue: Build fails

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Issue: Environment variables not working

**Solution:**
- Ensure variables start with `VITE_`
- Restart dev server after adding variables
- Check `.env.production` for production builds

### Issue: 404 on routes

**Solution:**
- Ensure rewrite rules in `firebase.json`
- Check that `index.html` is in dist folder

### Issue: CORS errors

**Solution:**
- Check Firebase Storage CORS configuration
- Update Firestore rules if needed

---

## 📈 Performance Optimization

### Before Deployment

1. **Image Optimization:**
   - Use WebP format
   - Compress images
   - Lazy load images

2. **Code Splitting:**
   - Already configured in vite.config.ts
   - Verify chunk sizes

3. **Caching:**
   - Headers configured in firebase.json
   - Service Worker for PWA

4. **Bundle Size:**
   - Check bundle analyzer
   - Remove unused dependencies

### After Deployment

1. **Monitor Core Web Vitals:**
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

2. **Firebase Performance:**
   - Track custom metrics
   - Set up alerts

---

## ✅ Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables set
- [ ] Security rules reviewed
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Analytics enabled
- [ ] Error tracking setup

### Post-Deployment

- [ ] Domain configured (if custom)
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team notified

---

## 📞 Support

For deployment issues:
1. Check Firebase Console logs
2. Review Vite build output
3. Check browser console for errors
4. Verify environment variables
5. Review Firestore/Security rules

---

**Status**: Production Ready ✅  
**Last Updated**: 2024  
**Version**: 1.0.0

