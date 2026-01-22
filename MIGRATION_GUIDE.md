# 🔄 Migration Guide: Create React App → Vite + TypeScript

## 📋 Overview

This guide will help you migrate from Create React App (CRA) to Vite + TypeScript for better performance and developer experience.

## 🚀 Step-by-Step Migration

### Step 1: Backup Current Project

```bash
# Create backup
cp -r . ../e-commerce-backup
```

### Step 2: Install Vite Dependencies

```bash
# Remove old CRA dependencies
npm uninstall react-scripts web-vitals

# Install Vite and TypeScript
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### Step 3: Update package.json

Replace scripts section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  }
}
```

### Step 4: Create Configuration Files

1. **vite.config.ts** - Already created ✅
2. **tsconfig.json** - Already created ✅
3. **tsconfig.node.json** - Already created ✅

### Step 5: Update index.html

Move `public/index.html` to root and update:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-Commerce Store</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 6: Create main.tsx

Create `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
);
```

### Step 7: Convert Files to TypeScript

#### Convert .js/.jsx to .ts/.tsx

1. **Rename files:**
   - `*.js` → `*.ts`
   - `*.jsx` → `*.tsx`

2. **Add types:**
   - Add type annotations to functions
   - Define interfaces for props
   - Add return types

#### Example Conversion:

**Before (JavaScript):**
```javascript
// components/Button.jsx
export default function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
```

**After (TypeScript):**
```typescript
// components/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ children, onClick }: ButtonProps): JSX.Element {
  return <button onClick={onClick}>{children}</button>;
}
```

### Step 8: Update Environment Variables

**CRA:** `REACT_APP_*`  
**Vite:** `VITE_*`

Update all environment variable references:

```typescript
// Before
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

// After
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

### Step 9: Update Imports

**CRA:** Uses relative paths or absolute from `src/`  
**Vite:** Can use path aliases

Update imports to use aliases:

```typescript
// Before
import Button from '../../components/common/Button';

// After
import Button from '@/components/common/Button';
```

### Step 10: Test the Migration

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Common Issues & Solutions

### Issue 1: Module not found

**Solution:** Check path aliases in `vite.config.ts` and `tsconfig.json`

### Issue 2: Environment variables not working

**Solution:** Rename `REACT_APP_*` to `VITE_*` and use `import.meta.env.VITE_*`

### Issue 3: CSS imports

**Solution:** Import CSS directly in components or use `globals.css`

### Issue 4: Image imports

**Solution:** Import images explicitly:
```typescript
import logo from '@/assets/images/logo.png';
```

## ✅ Checklist

- [ ] Install Vite dependencies
- [ ] Update package.json scripts
- [ ] Create vite.config.ts
- [ ] Create tsconfig.json
- [ ] Update index.html
- [ ] Create main.tsx
- [ ] Convert all .js/.jsx to .ts/.tsx
- [ ] Add TypeScript types
- [ ] Update environment variables
- [ ] Update imports
- [ ] Test dev server
- [ ] Test production build
- [ ] Update documentation

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## 🎯 Next Steps

After successful migration:

1. ✅ Optimize bundle size
2. ✅ Add code splitting
3. ✅ Improve performance
4. ✅ Add PWA support
5. ✅ Setup CI/CD

---

**Note:** This is a comprehensive migration. Take your time and test thoroughly after each step.

