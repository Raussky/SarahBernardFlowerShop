# 🌸 Sarah Bernard Flower Shop

A modern, feature-rich React Native e-commerce mobile application for flower delivery built with Expo and Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020.svg)](https://expo.dev/)

## ✨ Features

### Customer Features
- 🛍️ **Product Browsing**: Browse products by categories with advanced filtering
- 🔍 **Search & Filter**: Powerful search with category, price range, and sorting
- 🛒 **Shopping Cart**: Add products to cart (guest & authenticated users)
- ❤️ **Wishlist**: Save favorite products
- 💳 **Checkout**: Complete checkout flow with multiple payment methods
- 📦 **Order Tracking**: View order history and track order status
- 👤 **User Profiles**: Manage profile, addresses, and preferences
- 🎁 **Combo Deals**: Special bundle offers with discounts
- 📱 **Responsive Design**: Optimized for all screen sizes

### Admin Features
- 📊 **Dashboard**: Analytics with charts and key metrics
- 📝 **Product Management**: Create, edit, archive products with variants
- 🏷️ **Category Management**: Organize products with drag-and-drop reordering
- 📦 **Order Management**: Process orders, update status
- 🎁 **Combo Management**: Create and manage bundle deals
- 📈 **Analytics**: Sales charts, best sellers, revenue tracking

### Technical Features
- 🔐 **Security**: Row Level Security (RLS) policies, input validation
- 🔄 **Real-time Updates**: Live data sync with Supabase subscriptions
- 🎨 **Smooth Animations**: React Native Reanimated for 60fps animations
- 📱 **Offline Support**: Guest cart persistence with AsyncStorage
- 🔍 **Error Tracking**: Integrated error boundary with Sentry support
- 🧪 **Testing**: Comprehensive unit and integration tests
- 📝 **Logging**: Structured logging with context
- 🔁 **Retry Logic**: Automatic retry for failed network requests
- ✅ **Input Validation**: Client and server-side validation

---

## 🏗️ Architecture

```
SarahBernardFlowerShop/
├── App.js                      # Root component with providers
├── index.js                    # Expo entry point
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
│
├── assets/                     # Static assets
│   ├── fonts/                  # Custom fonts (PlusJakartaSans)
│   ├── images/                 # App images
│   └── splash/                 # Splash screen
│
├── src/
│   ├── components/             # Reusable UI components (15 files)
│   │   ├── ErrorBoundary.js    # Error boundary component
│   │   ├── ProductCard.js      # Product display card
│   │   ├── ToastProvider.js    # Toast notifications
│   │   └── ...
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.js      # Authentication state
│   │   ├── CartContext.js      # Shopping cart state
│   │   └── AnimationContext.js # Animation state
│   │
│   ├── services/               # API service layer
│   │   ├── productService.js   # Product CRUD operations
│   │   ├── orderService.js     # Order management
│   │   ├── homeService.js      # Home screen data
│   │   └── ...
│   │
│   ├── utils/                  # Utility functions
│   │   ├── logger.js           # Structured logging
│   │   ├── validation.js       # Input validation
│   │   ├── retry.js            # Retry logic
│   │   └── sentry.js           # Error tracking
│   │
│   ├── config/                 # Configuration
│   │   ├── constants.js        # App constants
│   │   ├── theme.js            # Theme and styles
│   │   └── env.js              # Environment config
│   │
│   ├── types/                  # Type definitions
│   │   └── index.js            # JSDoc types
│   │
│   └── integrations/
│       └── supabase/
│           └── client.js       # Supabase client
│
├── screens/                    # Screen components
│   ├── HomeScreen.js           # Main feed
│   ├── ProductScreen.js        # Product details
│   ├── CheckoutScreen.js       # Checkout flow
│   ├── admin/                  # Admin screens
│   └── ...
│
├── navigation/                 # Navigation structure
│   └── AdminNavigator.js       # Admin tab navigation
│
├── supabase/                   # Database
│   ├── migrations/             # SQL migrations
│   └── functions/              # Edge Functions
│
└── __tests__/                  # Tests
    └── ...
```

### Tech Stack

**Frontend:**
- React Native 0.81.4
- React 19.1.0
- Expo SDK 54
- React Navigation 6.x
- React Native Reanimated 4.x

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Row Level Security (RLS)
- Real-time subscriptions

**State Management:**
- React Context API
- AsyncStorage for persistence

**Testing:**
- Jest
- React Native Testing Library

**Code Quality:**
- ESLint
- TypeScript (strict mode)

**Build & Deploy:**
- EAS Build
- EAS Submit
- EAS Update

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Supabase account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/sarah-bernard-flower-shop.git
cd SarahBernardFlowerShop
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SENTRY_DSN=your_sentry_dsn (optional)
```

4. **Set up Supabase**

- Create a new Supabase project at https://supabase.com
- Run the SQL migrations from `supabase/migrations/`
- Configure RLS policies (see `SECURITY_SETUP.md`)
- Deploy Edge Functions from `supabase/functions/`

5. **Start the development server**

```bash
npm start
```

6. **Run on device/emulator**

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure

```
src/context/__tests__/
  ├── CartContext.test.js
  └── AuthContext.test.js (add this)

src/services/__tests__/
  └── productService.test.js (add this)

src/utils/__tests__/
  ├── validation.test.js (add this)
  └── retry.test.js (add this)
```

See `TESTING_GUIDE.md` for comprehensive testing documentation.

---

## 📦 Building for Production

### iOS

```bash
# Build for iOS App Store
npm run build:ios

# Submit to App Store
npm run submit:ios
```

### Android

```bash
# Build for Google Play Store
npm run build:android

# Submit to Play Store
npm run submit:android
```

### Over-The-Air Updates

```bash
# Push update to production
npm run update
```

---

## 🔐 Security

This application implements multiple security layers:

- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Client and server-side validation
- **Input Sanitization**: XSS protection
- **Server-side Price Validation**: Prevent price manipulation
- **Safe Deletion**: Checks for dependencies before deletion
- **Environment Variables**: Secrets not committed to git
- **HTTPS Only**: Enforced secure connections

**Important Security Notes:**

1. ⚠️ **NEVER commit `.env` file to git**
2. Rotate Supabase keys if exposed
3. Review RLS policies before production
4. Enable Sentry for error monitoring
5. Test all validation rules

See `SECURITY_SETUP.md` for detailed security configuration.

---

## 🐛 Error Monitoring

### Sentry Setup (Optional but Recommended)

```bash
# Install Sentry
npx @sentry/wizard@latest -i reactNative

# Add DSN to .env
SENTRY_DSN=your_sentry_dsn_here
```

See `SENTRY_SETUP.md` for complete setup guide.

---

## 📝 Documentation

- **[SECURITY_SETUP.md](./SECURITY_SETUP.md)** - Security configuration guide
- **[SENTRY_SETUP.md](./SENTRY_SETUP.md)** - Error tracking setup
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing best practices
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Production readiness checklist

---

## 🛠️ Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Run all validation
npm run validate
```

### Useful Commands

```bash
# Clear Metro cache
npm run start:clear

# Reset and reinstall
rm -rf node_modules && npm install

# Clear Expo cache
expo start -c
```

---

## 🌍 Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `SENTRY_DSN` | Sentry error tracking DSN | No |

See `.env.example` for template.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/tooling changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [React Navigation](https://reactnavigation.org/) for navigation
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) for animations

---

## 📞 Support

- 📧 Email: support@sarahbernard.kz
- 💬 Telegram: @sarahbernardshop
- 📱 WhatsApp: +77089217812

---

## 🗺️ Roadmap

- [ ] Push notifications for order updates
- [ ] Social auth (Google, Apple)
- [ ] Multi-language support (Russian, English, Kazakh)
- [ ] Payment gateway integration (Kaspi.kz)
- [ ] Loyalty program
- [ ] Product reviews and ratings
- [ ] In-app chat support
- [ ] Advanced analytics dashboard
- [ ] iOS widgets
- [ ] Apple Pay / Google Pay integration

---

Made with ❤️ in Kazakhstan
