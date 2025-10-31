# 🧪 Testing Guide

## Overview

This guide covers testing setup and best practices for the Sarah Bernard Flower Shop application.

---

## 📦 Installation

### Install Testing Dependencies

```bash
npm install --save-dev \
  jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  react-test-renderer
```

---

## 🔧 Configuration

The testing setup is already configured in:
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup and mocks
- `__mocks__/@env.js` - Environment variable mocks

---

## 🏃 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test CartContext.test
```

### Update Snapshots
```bash
npm test -- -u
```

---

## 📝 Writing Tests

### Unit Test Example (Context)

```javascript
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, CartContext } from '../CartContext';

describe('CartContext', () => {
  it('should add item to cart', async () => {
    const { result } = renderHook(() => React.useContext(CartContext), {
      wrapper: CartProvider,
    });

    const testItem = {
      id: '1',
      variantId: 'v1',
      name: 'Test Product',
      price: 5000,
    };

    await act(async () => {
      await result.current.addToCart(testItem, 'product');
    });

    expect(result.current.cart).toHaveLength(1);
  });
});
```

### Component Test Example

```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    image: 'test.jpg',
    product_variants: [{ id: 'v1', price: 5000, size: 'M' }],
  };

  it('should render product information', () => {
    const { getByText } = render(
      <ProductCard product={mockProduct} navigation={{}} />
    );

    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('₸5,000')).toBeTruthy();
  });

  it('should call navigation when pressed', () => {
    const mockNavigate = jest.fn();
    const { getByTestId } = render(
      <ProductCard
        product={mockProduct}
        navigation={{ navigate: mockNavigate }}
      />
    );

    fireEvent.press(getByTestId('product-card'));
    expect(mockNavigate).toHaveBeenCalledWith('Product', { product: mockProduct });
  });
});
```

### Service Test Example

```javascript
import { getProductDetails } from '../productService';
import { supabase } from '../../integrations/supabase/client';

jest.mock('../../integrations/supabase/client');

describe('productService', () => {
  it('should fetch product details', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      product_variants: [],
    };

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockProduct, error: null }),
    });

    const { data, error } = await getProductDetails('1');

    expect(error).toBeNull();
    expect(data).toEqual(mockProduct);
  });

  it('should handle errors gracefully', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    });

    const { data, error } = await getProductDetails('invalid-id');

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
```

---

## 🎯 Testing Best Practices

### 1. Test Structure (AAA Pattern)

```javascript
it('should add item to cart', async () => {
  // Arrange - Set up test data and mocks
  const testItem = { id: '1', name: 'Test' };

  // Act - Perform the action
  await act(async () => {
    await addToCart(testItem);
  });

  // Assert - Verify the result
  expect(cart).toHaveLength(1);
});
```

### 2. Use Descriptive Test Names

```javascript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should increment cart quantity when adding existing item', () => {});
```

### 3. Test User Behavior, Not Implementation

```javascript
// ❌ Bad - Testing implementation
it('should call setState', () => {
  expect(component.state.count).toBe(1);
});

// ✅ Good - Testing behavior
it('should display updated count after button click', () => {
  fireEvent.press(incrementButton);
  expect(getByText('Count: 1')).toBeTruthy();
});
```

### 4. Mock External Dependencies

```javascript
// Mock Supabase
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};
```

### 5. Clean Up After Tests

```javascript
describe('Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
});
```

---

## 📊 Coverage Goals

Current coverage thresholds (defined in `jest.config.js`):
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

Target for production:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Critical Areas Requiring Tests

1. **Context Providers** (Priority: High)
   - ✅ CartContext
   - ⬜ AuthContext
   - ⬜ AnimationContext

2. **Service Layer** (Priority: High)
   - ⬜ productService
   - ⬜ orderService
   - ⬜ categoryService
   - ⬜ homeService

3. **Utilities** (Priority: Medium)
   - ⬜ validation.js
   - ⬜ logger.js
   - ⬜ retry.js

4. **Critical Components** (Priority: High)
   - ⬜ ProductCard
   - ⬜ BasketScreen
   - ⬜ CheckoutScreen
   - ⬜ ErrorBoundary

5. **Screens** (Priority: Medium)
   - ⬜ HomeScreen
   - ⬜ ProductScreen
   - ⬜ CheckoutScreen flow

---

## 🔍 Testing Utilities

### Custom Test Utils

Create `src/utils/testUtils.js`:

```javascript
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/ToastProvider';

// Custom render with all providers
export function renderWithProviders(
  ui,
  { initialState = {}, ...renderOptions } = {}
) {
  function Wrapper({ children }) {
    return (
      <NavigationContainer>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </NavigationContainer>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock navigation prop
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
});

// Wait for async updates
export const waitForAsync = () =>
  new Promise(resolve => setTimeout(resolve, 0));
```

Usage:

```javascript
import { renderWithProviders, createMockNavigation } from '../utils/testUtils';

it('should render with all providers', () => {
  const navigation = createMockNavigation();
  const { getByText } = renderWithProviders(
    <MyScreen navigation={navigation} />
  );
  expect(getByText('Welcome')).toBeTruthy();
});
```

---

## 🚀 Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 📖 Additional Resources

- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎯 Next Steps

1. **Run existing tests**: `npm test`
2. **Add tests for AuthContext**: Follow CartContext.test.js pattern
3. **Add tests for services**: Start with productService.js
4. **Add tests for validation**: Test all validation functions
5. **Add integration tests**: Test complete user flows
6. **Set up CI/CD**: Automate test runs on every commit

---

## 💡 Tips

- Write tests as you code, not after
- Focus on high-value tests first (critical paths)
- Keep tests simple and readable
- Don't test implementation details
- Mock external dependencies consistently
- Use test coverage as a guide, not a goal
- Refactor tests when refactoring code
