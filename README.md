# Sarah Bernard Flower Shop - Mobile App

This is a mobile application for the Sarah Bernard Flower Shop, built with React Native and Expo. It allows users to browse products, add them to a cart, and place orders. It also includes a complete admin panel for managing products, categories, and orders.

## ✨ Features

-   **Customer Facing:**
    -   Browse products by category with sorting and filtering.
    -   View product details, including multiple images and variants.
    -   Add products to a shopping cart and a "saved for later" list.
    -   Place orders via a WhatsApp integration, with order details saved to the database.
    -   User authentication (Sign up/Login).
    -   View personal order history and details.
    -   Edit user profile and upload an avatar.
-   **Admin Panel:**
    -   Dashboard with key metrics (revenue, new orders, bestsellers).
    -   Manage products (create, edit, archive, upload multiple images).
    -   Manage product variants (size, price, stock).
    -   Manage categories.
    -   View and update customer order statuses.

## 🛠️ Tech Stack

-   **Frontend:** React Native, Expo
-   **Navigation:** React Navigation
-   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
-   **State Management:** React Context API
-   **Styling:** React Native StyleSheet
-   **Icons:** Ionicons from `@expo/vector-icons`

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
-   A free Supabase account and a new project.

### 1. Clone the Repository

First, clone this repository to your local machine.

```bash
git clone https://github.com/your-username/SarahBernardFlowerShop.git
cd SarahBernardFlowerShop
```

### 2. Install Dependencies

Install the project dependencies using npm or yarn.

```bash
npm install
```

### 3. Set up Supabase

This project requires a Supabase backend to function correctly.

**A. Create a Supabase Project:**

1.  Go to [supabase.com](https://supabase.com/) and create a new project.
2.  Keep your **Project URL** and **`anon` (public) key** handy. You can find them in your project's dashboard under `Project Settings > API`.

**B. Configure Supabase Client:**

The project already contains a file at `src/integrations/supabase/client.js`. Open it and replace the placeholder values with your actual Supabase URL and Key.

```javascript
// src/integrations/supabase/client.js
import { createClient } from '@supabase/supabase-js';

// Replace with your own Supabase URL and Anon Key
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

**C. Set up Database Schema & Storage:**

You will need to set up your database tables and storage policies. The easiest way is to go to the **SQL Editor** in your Supabase dashboard and run the SQL scripts for the required tables and policies.

**D. Set up Storage Buckets:**

1.  In your Supabase dashboard, go to the **Storage** section.
2.  Create two new buckets:
    -   `product-images`
    -   `avatars`
3.  Make sure both buckets are marked as **public**.

### 4. Run the Application

Once the setup is complete, you can start the development server.

```bash
npm start
```

This will open the Metro Bundler in your browser. You can then:

-   **Scan the QR code** with the Expo Go app on your iOS or Android phone.
-   Press `i` to run on an iOS simulator (requires Xcode on macOS).
-   Press `a` to run on an Android emulator (requires Android Studio).

---

Enjoy developing the Sarah Bernard Flower Shop app!