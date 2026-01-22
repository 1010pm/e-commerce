# 🚀 Setup Guide

## Firebase Configuration

For security, the `firebase.config.js` file is **not included** in this repository.

### To set up Firebase:

1. **Copy the example file:**
   ```bash
   cp src/config/firebase.config.example.js src/config/firebase.config.js
   ```

2. **Get your Firebase credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the configuration values

3. **Update `firebase.config.js` with your actual values:**
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     // ... etc
   };
   ```

4. **OR use environment variables (recommended):**
   
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   The `.env.local` file is automatically ignored by git.

## Installation

```bash
npm install
```

## Running the App

```bash
npm start
```

## Building for Production

```bash
npm run build
```

---

**⚠️ Security Note:** Never commit your `firebase.config.js` or `.env.local` files to git!
