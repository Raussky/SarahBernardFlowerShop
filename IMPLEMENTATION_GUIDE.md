# 🚀 Implementation Guide

## Quick Start for Production Improvements

This guide helps you implement all the production readiness improvements step by step.

---

## 📚 Documentation Overview

| Document | Purpose | Priority |
|----------|---------|----------|
| **SECURITY_SETUP.md** | Secure environment variables and database | 🔴 Critical |
| **SENTRY_SETUP.md** | Error tracking and monitoring | 🔴 Critical |
| **TESTING_GUIDE.md** | Testing infrastructure and best practices | 🔴 Critical |
| **PRODUCTION_CHECKLIST.md** | Track all tasks to completion | ⚡ Reference |
| **IMPLEMENTATION_GUIDE.md** | This file - step-by-step execution | 📖 Start Here |

---

## 🎯 Implementation Path

### Phase 1: Security (1-2 days) - DO THIS FIRST ⚠️

**Priority**: 🔴 CRITICAL - Cannot go to production without this

#### Step 1.1: Environment Variables (30 minutes)

```bash
# 1. Your .env file is currently in Git - this is a security risk
# First, verify it's in .gitignore (it is, line 88)

# 2. Copy .env.example to create template
# The .env.example file has been created for you

# 3. Follow SECURITY_SETUP.md to:
#    - Rotate Supabase keys
#    - Clean Git history
#    - Update team about new keys
```

**Files to review:**
- `SECURITY_SETUP.md` - Steps 1-2
- `.env.example` - Template for environment variables

#### Step 1.2: Row Level Security (2 hours)

```bash
# 1. Go to Supabase Dashboard → Authentication → Policies
# 2. Follow SECURITY_SETUP.md Step 3 to create RLS policies
# 3. Test each policy with different users
# 4. Document which tables have RLS enabled
```

**Files to review:**
- `SECURITY_SETUP.md` - Step 3
- Test with: `screens/CheckoutScreen.js`, `src/context/CartContext.js`

#### Step 1.3: Input Validation (3 hours)

```bash
# The validation utilities are already created for you
# Now integrate them into your forms:

# 1. Update CheckoutScreen.js
import { validateOrderData } from '../src/utils/validation';

# 2. Update EditProductScreen.js
import { validateProductData } from '../src/utils/validation';

# 3. Update EditProfileScreen.js
import { validateName, validateEmail, validatePhoneNumber } from '../src/utils/validation';
```

**Files to update:**
- `screens/CheckoutScreen.js` - Line 65 (validateForm function)
- `screens/EditProductScreen.js` - Validation before submit
- `screens/EditProfileScreen.js` - Form validation

**New files created:**
- ✅ `src/utils/validation.js` - Ready to use

---

### Phase 2: Error Tracking (2-3 hours)

**Priority**: 🔴 CRITICAL - Need visibility into production errors

#### Step 2.1: Install Sentry (30 minutes)

```bash
# Run the Sentry wizard
npx @sentry/wizard@latest -i reactNative

# This will:
# - Install @sentry/react-native
# - Create sentry.properties
# - Configure native projects
```

#### Step 2.2: Configure Sentry (1 hour)

```bash
# 1. Create Sentry account at https://sentry.io
# 2. Create new project for "React Native"
# 3. Copy DSN from project settings
# 4. Add to .env:
echo 'SENTRY_DSN=your_dsn_here' >> .env
```

**Follow**: `SENTRY_SETUP.md` - Complete guide

#### Step 2.3: Integrate Sentry (1 hour)

```bash
# 1. Create sentry utility (already done)
# File: src/utils/sentry.js

# 2. Initialize in App.js
# This is already integrated! Check App.js line 14

# 3. Update logger to send to Sentry
# Instructions in SENTRY_SETUP.md Step 6

# 4. Test error reporting
# Use test buttons in SENTRY_SETUP.md Step 7
```

**Files already created:**
- ✅ `src/utils/sentry.js` - Needs Sentry SDK installed
- ✅ `src/utils/logger.js` - Ready for Sentry integration
- ✅ `src/components/ErrorBoundary.js` - Already integrated

---

### Phase 3: Testing Infrastructure (1 day)

**Priority**: 🔴 CRITICAL - Need tests before making changes

#### Step 3.1: Install Dependencies (10 minutes)

```bash
# Install testing libraries
npm install --save-dev \
  jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  react-test-renderer
```

#### Step 3.2: Run Existing Tests (5 minutes)

```bash
# The test configuration is already set up for you
npm test

# You should see:
# - CartContext tests (already written)
# - Test configuration working
```

**Files already created:**
- ✅ `jest.config.js` - Jest configuration
- ✅ `jest.setup.js` - Test setup and mocks
- ✅ `src/context/__tests__/CartContext.test.js` - Example tests

#### Step 3.3: Write More Tests (1 day)

```bash
# Follow TESTING_GUIDE.md to write tests for:
# 1. AuthContext (high priority)
# 2. productService (high priority)
# 3. validation utils (medium priority)
# 4. CheckoutScreen flow (high priority)

# Run with coverage to see progress
npm test -- --coverage
```

**Follow**: `TESTING_GUIDE.md` - Complete testing guide

---

### Phase 4: Code Quality Improvements (2-3 days)

**Priority**: 🟡 Important - Improves maintainability

#### Step 4.1: Replace Console Statements (3 hours)

```bash
# Search and replace throughout codebase
# Before: console.error('Error:', error);
# After: logger.error('Error', error, { context: 'ScreenName' });

# Files to update (63 instances across 20 files):
# Run this search: grep -r "console\.(error|log|warn)" --include="*.js" src/ screens/
```

**Pattern to follow:**

```javascript
// ❌ Before
console.error('Error loading cart:', error);

// ✅ After
import { logger } from '../utils/logger';
logger.error('Error loading cart', error, { context: 'CartContext' });
```

#### Step 4.2: Use Constants (2 hours)

```bash
# Update files to use constants instead of magic numbers/strings

# Example files to update:
# 1. screens/CheckoutScreen.js
# 2. src/components/ProductCard.js
# 3. screens/BasketScreen.js
```

**Example:**

```javascript
// ❌ Before
if (unmaskedPhone.length < 11) {
  setPhoneError('Введите корректный номер телефона');
}

// ✅ After
import { PHONE_NUMBER_MIN_LENGTH, ERROR_MESSAGES } from '../config/constants';
if (unmaskedPhone.length < PHONE_NUMBER_MIN_LENGTH) {
  setPhoneError(ERROR_MESSAGES.INVALID_INPUT);
}
```

**Files already created:**
- ✅ `src/config/constants.js` - All constants ready

#### Step 4.3: Add Retry Logic (2 hours)

```bash
# Integrate retry utility into service functions
# Focus on network-dependent operations
```

**Example:**

```javascript
// ❌ Before
export const getHomeScreenData = async () => {
  const { data, error } = await supabase.from('products').select('*');
  return data;
};

// ✅ After
import { retry, RETRY_PRESETS } from '../utils/retry';

export const getHomeScreenData = async () => {
  return retry(async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return data;
  }, RETRY_PRESETS.standard);
};
```

**Files to update:**
- `src/services/productService.js`
- `src/services/homeService.js`
- `src/services/orderService.js`

**Files already created:**
- ✅ `src/utils/retry.js` - Ready to integrate

---

### Phase 5: Performance Optimizations (1-2 days)

**Priority**: 🟡 Important - Improves user experience

#### Step 5.1: Add Memoization (3 hours)

```javascript
// Example: BasketScreen.js

// ❌ Before
const getSubtotal = () => {
  return cart.reduce((total, item) => {
    const price = item.product_variants?.price || item.combos?.price || 0;
    return total + price * item.quantity;
  }, 0);
};

// ✅ After
import { useMemo } from 'react';

const subtotal = useMemo(() => {
  return cart.reduce((total, item) => {
    const price = item.product_variants?.price || item.combos?.price || 0;
    return total + price * item.quantity;
  }, 0);
}, [cart]);
```

**Files to optimize:**
- `screens/BasketScreen.js` - Memoize calculations
- `screens/HomeScreen.js` - Memoize filtered data
- `src/components/ProductCard.js` - Use React.memo

#### Step 5.2: Optimize Realtime Subscriptions (1 hour)

```javascript
// screens/HomeScreen.js - Line 76

// ❌ Before
const channel = supabase
  .channel('public:home_screen_data')
  .on('postgres_changes', { event: '*', schema: 'public' }, () => {
    loadData();
  })

// ✅ After
const channel = supabase
  .channel('home_products_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'products'  // Only listen to products table
  }, () => {
    loadData();
  })
```

---

### Phase 6: Monitoring & Analytics (1 day)

**Priority**: 🟡 Important - Understand user behavior

#### Step 6.1: Set Up Analytics (Optional)

```bash
# Choose one:
# - Firebase Analytics (free, Google)
# - Amplitude (generous free tier)
# - Mixpanel (limited free tier)

# Example with Firebase:
npm install @react-native-firebase/app @react-native-firebase/analytics
```

#### Step 6.2: Track Key Events

```javascript
// Track important user actions
import { logger } from '../utils/logger';

// Add to cart
logger.trackEvent('add_to_cart', {
  product_id: product.id,
  product_name: product.name,
  price: variant.price,
});

// Purchase
logger.trackEvent('purchase', {
  order_id: order.id,
  total: order.total_price,
  items_count: cart.length,
});
```

---

## 📝 Quick Commands Reference

### Development

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Build for production (EAS)
eas build --platform all --profile production
```

### Code Quality

```bash
# Find console statements to replace
grep -r "console\.(error|log|warn)" --include="*.js" src/ screens/

# Find magic numbers (numbers not in constants)
grep -rP '\d{2,}' --include="*.js" src/ screens/ | grep -v "line 1"

# Check for TODO comments
grep -r "TODO\|FIXME" --include="*.js" src/ screens/
```

---

## 🎯 Priority Order

If you have limited time, do these in order:

### Day 1: Critical Security
1. ✅ Read SECURITY_SETUP.md
2. ⬜ Rotate Supabase keys (30 min)
3. ⬜ Configure RLS policies (2 hours)
4. ⬜ Clean .env from Git history (30 min)

### Day 2: Error Tracking
1. ⬜ Install Sentry (30 min)
2. ⬜ Configure Sentry (1 hour)
3. ⬜ Integrate logger with Sentry (1 hour)
4. ⬜ Test error reporting (30 min)

### Day 3: Testing
1. ⬜ Install test dependencies (10 min)
2. ⬜ Run existing tests (5 min)
3. ⬜ Write AuthContext tests (2 hours)
4. ⬜ Write productService tests (2 hours)

### Day 4-5: Code Quality
1. ⬜ Replace console.* with logger (3 hours)
2. ⬜ Use constants throughout (2 hours)
3. ⬜ Add retry logic to services (2 hours)
4. ⬜ Add memoization (2 hours)

---

## ✅ Verification

After each phase, verify your work:

### Security Verification

```bash
# Check .env not in git
git ls-files | grep ".env$"
# Should return nothing

# Test RLS policies
# Try accessing another user's cart in Supabase SQL editor
SELECT * FROM cart_items WHERE user_id = '<another_user_id>';
# Should return nothing
```

### Sentry Verification

```bash
# 1. Add test button in app (dev mode only)
# 2. Trigger test error
# 3. Check Sentry dashboard
# 4. Should see error with context, breadcrumbs, user info
```

### Testing Verification

```bash
# Check test coverage
npm test -- --coverage

# Should show:
# - Statements: > 50%
# - Branches: > 50%
# - Functions: > 50%
# - Lines: > 50%
```

---

## 🆘 Getting Help

### If You're Stuck

1. **Check the specific guide**: Each MD file has detailed steps
2. **Check the code**: All utilities are created and documented
3. **Check the tests**: CartContext tests show patterns to follow
4. **Search the issue**: Check console for specific error messages

### Common Issues

#### "Module not found: @env"

```bash
# Make sure .env file exists
ls -la .env

# Restart Metro bundler
npm start --reset-cache
```

#### "Sentry not initialized"

```bash
# Check SENTRY_DSN in .env
cat .env | grep SENTRY_DSN

# Make sure Sentry is initialized before app renders
# Check App.js line 14
```

#### "Tests failing"

```bash
# Clear Jest cache
npm test -- --clearCache

# Make sure mocks are correct
# Check jest.setup.js
```

---

## 📊 Progress Tracking

Use `PRODUCTION_CHECKLIST.md` to track your progress. Update checkboxes as you complete tasks.

**Estimated Total Time**:
- Critical tasks: ~5-7 days
- Important tasks: ~3-4 days
- Nice-to-have: Ongoing

**Minimum for Soft Launch**: Complete all critical tasks (~1 week focused work)

---

## 🎉 When You're Done

After completing all critical tasks:

1. ✅ Review PRODUCTION_CHECKLIST.md - all critical items checked
2. ✅ Run full test suite - all passing
3. ✅ Security audit - RLS tested, keys rotated
4. ✅ Error tracking active - Sentry reporting
5. ✅ Build production app - EAS build succeeds
6. ✅ Beta test with small group
7. 🚀 Launch!

---

## 📞 Support

- **Security Questions**: See SECURITY_SETUP.md
- **Sentry Issues**: See SENTRY_SETUP.md
- **Testing Help**: See TESTING_GUIDE.md
- **Task Tracking**: See PRODUCTION_CHECKLIST.md

Good luck! 🚀
