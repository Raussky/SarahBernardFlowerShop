# 🔍 Sentry Setup Guide

## Overview

Sentry provides real-time error tracking and monitoring for production applications. This guide covers setup for React Native/Expo.

---

## 📦 Installation

### Step 1: Install Sentry SDK

```bash
npx @sentry/wizard@latest -i reactNative
```

This wizard will:
- Install `@sentry/react-native` package
- Configure Sentry in your project
- Set up source maps for error reporting
- Add necessary native configurations

**OR** install manually:

```bash
npm install @sentry/react-native
```

---

## 🔐 Step 2: Get Sentry DSN

1. **Create Sentry Account**
   - Go to: https://sentry.io/signup/
   - Create a new account or log in

2. **Create New Project**
   - Click "Create Project"
   - Select "React Native" as platform
   - Name: "sarah-bernard-flower-shop"
   - Click "Create Project"

3. **Copy DSN**
   - After project creation, copy the DSN (Data Source Name)
   - Format: `https://xxxxx@oxxxx.ingest.sentry.io/xxxxx`

---

## ⚙️ Step 3: Configure Sentry

### Add DSN to Environment Variables

**File**: `.env`
```bash
SUPABASE_URL=https://wdrlhevvavvaleasekge.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_key_here
SENTRY_DSN=https://xxxxx@oxxxx.ingest.sentry.io/xxxxx
```

**File**: `.env.example`
```bash
SENTRY_DSN=your_sentry_dsn_here
```

### Update Environment Config

**File**: `src/config/env.js`

```javascript
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SENTRY_DSN } from '@env';

export const appConfig = {
  // ... existing config

  sentry: {
    dsn: SENTRY_DSN,
    environment: ENV,
    enabled: isProduction,
    tracesSampleRate: 1.0,
    beforeSend: (event) => {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  },
};
```

---

## 🔌 Step 4: Initialize Sentry

### Create Sentry Initializer

**File**: `src/utils/sentry.js`

```javascript
import * as Sentry from '@sentry/react-native';
import { appConfig } from '../config/env';

/**
 * Initialize Sentry error tracking
 */
export function initSentry() {
  if (!appConfig.sentry.enabled || !appConfig.sentry.dsn) {
    console.log('Sentry disabled or DSN not configured');
    return;
  }

  Sentry.init({
    dsn: appConfig.sentry.dsn,
    environment: appConfig.sentry.environment,
    tracesSampleRate: appConfig.sentry.tracesSampleRate,
    beforeSend: appConfig.sentry.beforeSend,

    // Enable automatic session tracking
    enableAutoSessionTracking: true,

    // Session timeout in ms
    sessionTrackingIntervalMillis: 30000,

    // Enable native crash reporting
    enableNative: true,

    // Attachments
    attachStacktrace: true,

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass routing instrumentation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),

        // Set to false to disable automatic performance monitoring
        tracingOrigins: ['localhost', /^\//],
      }),
    ],
  });

  console.log('Sentry initialized');
}

/**
 * Set user context for error reports
 */
export function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Don't send sensitive data like phone numbers
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Capture error manually
 */
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set custom tag
 */
export function setSentryTag(key, value) {
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setSentryContext(name, context) {
  Sentry.setContext(name, context);
}

export { Sentry };
```

---

## 🚀 Step 5: Integrate Sentry in App

### Update App.js

```javascript
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { initSentry, setSentryUser } from './src/utils/sentry';
// ... other imports

// Initialize Sentry before rendering
initSentry();

export default function App() {
  // ... existing code

  return (
    <ErrorBoundary>
      {/* ... rest of app */}
    </ErrorBoundary>
  );
}
```

### Update AuthContext to Set User

**File**: `src/context/AuthContext.js`

```javascript
import { setSentryUser } from '../utils/sentry';

export const AuthProvider = ({ children }) => {
  // ... existing code

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Set Sentry user context
        setSentryUser(session.user);

        // ... rest of profile fetching
      } else {
        setSentryUser(null);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();
  }, []);

  // ... rest of code
};
```

---

## 📝 Step 6: Update Logger to Use Sentry

**File**: `src/utils/logger.js`

```javascript
import { captureError, captureMessage, addSentryBreadcrumb } from './sentry';

class Logger {
  // ... existing code

  info(message, meta = {}) {
    const log = this._formatLog('INFO', message, meta);

    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, meta);
    }

    // Add Sentry breadcrumb
    addSentryBreadcrumb(message, 'info', 'info', meta);

    return log;
  }

  warn(message, meta = {}) {
    const log = this._formatLog('WARN', message, meta);

    console.warn(`[WARN] ${message}`, meta);

    // Add Sentry breadcrumb
    addSentryBreadcrumb(message, 'warning', 'warning', meta);

    return log;
  }

  error(message, error = null, meta = {}) {
    const log = this._formatLog('ERROR', message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
    });

    console.error(`[ERROR] ${message}`, error, meta);

    // Send to Sentry
    if (error instanceof Error) {
      captureError(error, meta);
    } else {
      captureMessage(message, 'error', { ...meta, error });
    }

    return log;
  }

  // ... rest of methods
}
```

---

## 🧪 Step 7: Test Sentry Integration

### Add Test Button (Development Only)

```javascript
import { captureError, captureMessage } from './src/utils/sentry';

// In a development screen
if (__DEV__) {
  <Button
    title="Test Sentry Error"
    onPress={() => {
      try {
        throw new Error('Test error from React Native');
      } catch (error) {
        captureError(error, {
          context: 'Test Button',
          timestamp: new Date().toISOString(),
        });
      }
    }}
  />

  <Button
    title="Test Sentry Message"
    onPress={() => {
      captureMessage('Test message from React Native', 'info', {
        userId: 'test-user',
      });
    }}
  />
}
```

### Verify in Sentry Dashboard

1. Press the test button
2. Go to Sentry dashboard: https://sentry.io/
3. Navigate to your project
4. Check "Issues" tab - you should see the test error
5. Click on the error to see full details:
   - Stack trace
   - Breadcrumbs
   - User context
   - Device info

---

## 📊 Step 8: Configure Sentry Alerts

### Set Up Email Alerts

1. Go to **Settings** → **Alerts**
2. Click **Create Alert Rule**
3. Choose **Issues**
4. Configure conditions:
   - When: "An event is first seen"
   - Or: "An event occurs more than X times in Y minutes"
5. Choose action: "Send email"
6. Add team members

### Recommended Alert Rules

1. **Critical Errors**
   - Condition: First seen
   - Action: Email + Slack notification
   - Filter: Level = error

2. **Spike in Errors**
   - Condition: >10 errors in 5 minutes
   - Action: Email to on-call team

3. **New Release Issues**
   - Condition: Error in new release
   - Action: Email to release manager

---

## 🔧 Step 9: Source Maps for Debugging

### Configure EAS Build for Source Maps

**File**: `eas.json`

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "SENTRY_ORG": "your-org-name",
        "SENTRY_PROJECT": "sarah-bernard-flower-shop"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

### Upload Source Maps

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Login to Sentry
sentry-cli login

# Upload source maps after build
sentry-cli releases files <release-version> upload-sourcemaps \
  --dist <dist-id> \
  --rewrite \
  ./path/to/sourcemaps
```

---

## 📈 Step 10: Monitor Performance

### Track Navigation Performance

```javascript
import * as Sentry from '@sentry/react-native';

// In NavigationContainer
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  // ... other config
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
    }),
  ],
});

// In App.js
<NavigationContainer
  ref={navigationRef}
  onReady={() => {
    routingInstrumentation.registerNavigationContainer(navigationRef);
  }}
>
```

### Track Custom Transactions

```javascript
import * as Sentry from '@sentry/react-native';

// Track API call performance
async function fetchProducts() {
  const transaction = Sentry.startTransaction({
    op: 'api.call',
    name: 'Fetch Products',
  });

  try {
    const response = await supabase.from('products').select('*');
    transaction.setStatus('ok');
    return response;
  } catch (error) {
    transaction.setStatus('error');
    throw error;
  } finally {
    transaction.finish();
  }
}
```

---

## 🎯 Best Practices

### 1. Filter Sensitive Data

```javascript
Sentry.init({
  beforeSend: (event) => {
    // Remove passwords
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.credit_card;
    }

    // Remove PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data?.phone_number) {
          delete breadcrumb.data.phone_number;
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
```

### 2. Group Similar Errors

```javascript
Sentry.init({
  beforeSend: (event) => {
    // Normalize error messages to group similar errors
    if (event.exception?.values?.[0]?.value) {
      event.fingerprint = ['{{ default }}', event.exception.values[0].type];
    }
    return event;
  },
});
```

### 3. Set Release Versions

```javascript
import { version } from './package.json';

Sentry.init({
  release: `sarah-bernard-flower-shop@${version}`,
  dist: '1', // Build number
});
```

### 4. Use Environments

```javascript
Sentry.init({
  environment: __DEV__ ? 'development' : 'production',
  // Don't send errors from development
  enabled: !__DEV__,
});
```

---

## ✅ Verification Checklist

- [ ] Sentry SDK installed
- [ ] DSN configured in .env
- [ ] Sentry initialized in App.js
- [ ] User context set on login
- [ ] Logger integrated with Sentry
- [ ] Test error sent successfully
- [ ] Errors visible in Sentry dashboard
- [ ] Breadcrumbs showing up
- [ ] Email alerts configured
- [ ] Source maps uploaded
- [ ] Sensitive data filtered
- [ ] Team members invited to project

---

## 📞 Support

- Sentry Docs: https://docs.sentry.io/platforms/react-native/
- Expo + Sentry: https://docs.expo.dev/guides/using-sentry/
- Community: https://forum.sentry.io/
