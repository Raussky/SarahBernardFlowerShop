# 🔒 Security Setup Guide

## ⚠️ CRITICAL: Environment Variables Security

### Current Status
Your `.env` file contains sensitive credentials. Follow these steps immediately:

---

## 🚨 Step 1: Rotate Supabase Keys (URGENT)

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project: `wdrlhevvavvaleasekge`

2. **Generate New Anon/Public Key**
   - Go to: Settings → API
   - Click "Reset" next to the anon/public key
   - **Important**: This will invalidate the old key immediately
   - Copy the new key

3. **Update Your Local .env File**
   ```bash
   # Replace with new credentials
   SUPABASE_URL=https://wdrlhevvavvaleasekge.supabase.co
   SUPABASE_PUBLISHABLE_KEY=<your_new_key_here>
   ```

---

## 🧹 Step 2: Remove .env from Git History

The `.env` file was committed to git history. Clean it:

```bash
# Method 1: Using git filter-branch (for smaller repos)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Method 2: Using BFG Repo-Cleaner (recommended for larger repos)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# After cleaning, force push (ONLY if private repo)
git push origin --force --all
git push origin --force --tags
```

⚠️ **Warning**: Force pushing rewrites history. Coordinate with your team.

---

## 🛡️ Step 3: Configure Row Level Security (RLS)

Verify RLS is enabled for all sensitive tables:

### 1. Go to Supabase Dashboard → Authentication → Policies

### 2. Check these tables have RLS enabled:

#### `profiles` table
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### `cart_items` table
```sql
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);
```

#### `saved_products` table
```sql
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved products"
ON saved_products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved products"
ON saved_products FOR ALL
USING (auth.uid() = user_id);
```

#### `orders` table
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all orders (create admin role first)
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

#### `addresses` table
```sql
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
ON addresses FOR ALL
USING (auth.uid() = user_id);
```

### 3. Test RLS Policies

```sql
-- Test as authenticated user
SELECT * FROM cart_items; -- Should only return your items

-- Try to access another user's data (should return nothing)
SELECT * FROM cart_items WHERE user_id = '<another_user_id>';
```

---

## 🔐 Step 4: Secure Admin Access

### Create Admin Role

```sql
-- Create admin role
CREATE TYPE user_role AS ENUM ('user', 'admin');

ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';

-- Make specific user admin
UPDATE profiles
SET role = 'admin'
WHERE id = '<your_admin_user_id>';
```

### Add RLS for Admin Tables

```sql
-- products table (read-only for users, write for admins)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 📝 Step 5: Input Validation

Currently, order prices are calculated on the client. This is a security risk.

### Create Server-Side Order Validation

Create a new Edge Function:

```bash
# In supabase/functions/
npx supabase functions new create-order
```

**File**: `supabase/functions/create-order/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { items, delivery_method, customer_info } = await req.json()

  // Validate and calculate prices server-side
  let total = 0
  const validatedItems = []

  for (const item of items) {
    if (item.product_variant_id) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('price, stock_quantity')
        .eq('id', item.product_variant_id)
        .single()

      if (!variant || variant.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({ error: 'Insufficient stock' }),
          { status: 400 }
        )
      }

      total += variant.price * item.quantity
      validatedItems.push({ ...item, price: variant.price })
    }
  }

  // Add delivery cost
  if (delivery_method === 'delivery') {
    total += 500
  }

  // Create order with validated data
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      ...customer_info,
      total_price: total,
      items: validatedItems
    })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }

  return new Response(
    JSON.stringify({ order }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## 🎯 Step 6: Environment Management

### Create Environment-Specific Files

```bash
# Development
cp .env.example .env.development

# Production
cp .env.example .env.production
```

### Update `babel.config.js`

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }],
      'react-native-worklets/plugin'
    ]
  };
};
```

---

## ✅ Security Checklist

- [ ] Rotated Supabase keys
- [ ] Removed .env from git history
- [ ] Enabled RLS on all sensitive tables
- [ ] Tested RLS policies
- [ ] Created admin role system
- [ ] Created server-side order validation Edge Function
- [ ] Set up environment-specific configurations
- [ ] Updated team about new security practices
- [ ] Added .env.example to repository
- [ ] Documented security procedures

---

## 🔄 Regular Security Practices

1. **Never commit .env files**
   - Always use .env.example as template
   - Keep actual credentials in secure password manager

2. **Rotate keys quarterly**
   - Schedule calendar reminder
   - Test after rotation

3. **Review RLS policies monthly**
   - Audit access logs in Supabase
   - Check for unauthorized access attempts

4. **Use different credentials for dev/staging/prod**
   - Never use production keys in development

---

## 🆘 Security Incident Response

If credentials are exposed:

1. **Immediate**: Rotate all affected keys in Supabase Dashboard
2. **Within 1 hour**: Review access logs for suspicious activity
3. **Within 24 hours**: Notify affected users if data was accessed
4. **Within 1 week**: Conduct security audit and update procedures

---

## 📞 Support

- Supabase Security: https://supabase.com/docs/guides/platform/security
- Report security issues: [Your security contact email]
