# Authentication Setup Guide

This guide explains how to configure authentication for your Autopilot app.

## Authentication Flow

1. **Landing Page** (`/`) - Black Friday promotional page with Stripe checkout
2. **Stripe Checkout** - Users pay via Stripe (redirects back to your app)
3. **Login Page** (`/login`) - Users create account or sign in with email/password or Google
4. **App Dashboard** (`/app`) - Protected route with WorkflowAutopilot (requires authentication)

## Features

- ✅ Email/Password Authentication
- ✅ Google OAuth Sign-in
- ✅ User Registration (Sign Up)
- ✅ Protected Routes (redirects to /login if not authenticated)
- ✅ Sign Out functionality
- ✅ Email Confirmation (optional)

## Supabase Configuration

### 1. Enable Email Authentication

In your Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Enable **Email Authentication**
4. Configure email settings:
   - **Enable Email Confirmations**: Toggle ON if you want users to verify their email
   - **Secure Email Change**: Recommended ON
   - **Secure Password Change**: Recommended ON

### 2. Enable Google OAuth (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Find **Google** provider
3. Enable **Google**
4. Configure Google OAuth:

   **Option A: Use Supabase's OAuth (Easiest)**
   - Just toggle it ON
   - Supabase provides a default OAuth configuration for development
   - For production, follow Option B

   **Option B: Use Your Own Google OAuth App (Recommended for Production)**

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)

   b. Create a new project or select an existing one

   c. Enable Google+ API:
      - Navigate to **APIs & Services** → **Library**
      - Search for "Google+ API"
      - Click **Enable**

   d. Create OAuth Credentials:
      - Go to **APIs & Services** → **Credentials**
      - Click **Create Credentials** → **OAuth 2.0 Client ID**
      - Configure consent screen if prompted
      - Application type: **Web application**
      - Name: "Autopilot App"
      - Authorized JavaScript origins:
        ```
        http://localhost:3000
        https://your-domain.com
        ```
      - Authorized redirect URIs:
        ```
        https://your-project-ref.supabase.co/auth/v1/callback
        ```
      - Click **Create**

   e. Copy your **Client ID** and **Client Secret**

   f. Back in Supabase:
      - Paste **Client ID** in the Google provider settings
      - Paste **Client Secret** in the Google provider settings
      - Save

### 3. Configure Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/app`
   - `https://your-domain.com/app`
   - Any other URLs you want to redirect to after authentication

### 4. Configure Email Templates (Optional)

Customize the emails Supabase sends:

1. Go to **Authentication** → **Email Templates**
2. Customize templates:
   - **Confirm signup**: Sent when user signs up
   - **Invite user**: Sent when inviting users
   - **Magic Link**: Sent for passwordless login
   - **Change Email Address**: Sent when changing email
   - **Reset Password**: Sent for password reset

### 5. Email Rate Limiting (Production)

For production, configure rate limiting to prevent abuse:

1. Go to **Authentication** → **Rate Limits**
2. Configure limits for:
   - Email signups
   - Password resets
   - Magic links

## Environment Variables

Make sure these are set in your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing Authentication

### Test Email/Password Auth

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click the Stripe checkout button (or go directly to `/login`)
4. Click "Create account"
5. Enter email and password (min 6 characters)
6. Click "Sign Up"
7. If email confirmation is enabled, check your email and click the confirmation link
8. Sign in with your credentials
9. You should be redirected to `/app`

### Test Google OAuth

1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Select your Google account
4. Authorize the app
5. You should be redirected to `/app`

### Test Protected Routes

1. While signed out, try to access `http://localhost:3000/app` directly
2. You should be automatically redirected to `/login`
3. After signing in, you'll be redirected back to `/app`

### Test Sign Out

1. While signed in at `/app`, click "Sign Out" in the top-right corner
2. You should be redirected to the landing page (`/`)
3. If you try to access `/app` again, you'll be redirected to `/login`

## Stripe Integration

After users complete payment on Stripe, you'll want to redirect them to the login page:

### Configure Stripe Checkout

In your Stripe Dashboard:

1. Go to your **Payment Link** or **Checkout Session** settings
2. Set the **Success URL** to: `https://your-domain.com/login?payment=success`
3. Set the **Cancel URL** to: `https://your-domain.com/?payment=cancelled`

### Handle Payment Webhooks (Optional)

To automatically provision access after payment, set up Stripe webhooks:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

Create webhook handler at `src/pages/api/stripe-webhook.js`:

```javascript
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Grant access to user
      // You can update user metadata in Supabase here
      const customerEmail = session.customer_details?.email;

      if (customerEmail) {
        // Update user's subscription status
        await supabaseAdmin
          .from('profiles')
          .upsert({
            email: customerEmail,
            subscription_status: 'active',
            stripe_customer_id: session.customer,
          });
      }
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }

  res.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
```

## User Database Schema (Optional)

Create a `profiles` table to store additional user information:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Security Best Practices

1. **Never expose service role key** - Only use it server-side
2. **Enable Row Level Security (RLS)** on all tables
3. **Use HTTPS** in production
4. **Validate user input** before database operations
5. **Rate limit authentication endpoints**
6. **Enable email confirmation** for production
7. **Configure CAPTCHA** to prevent bot signups (optional)

## Troubleshooting

### "Invalid API key" error
- Check that your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure environment variables are prefixed with `NEXT_PUBLIC_` for client-side access

### Google OAuth not working
- Verify authorized redirect URIs match exactly (including trailing slashes)
- Check that Google+ API is enabled
- Ensure Site URL is configured in Supabase

### Users not being created
- Check Supabase logs: **Authentication** → **Logs**
- Verify email provider is enabled
- Check if email confirmations are required

### Redirects not working
- Verify redirect URLs are added to allowed list in Supabase
- Check that `redirectTo` URLs use the correct domain

## Next Steps

After setting up authentication:

1. ✅ Test the complete flow from landing → payment → login → app
2. ✅ Configure Stripe webhooks for automatic provisioning
3. ✅ Customize email templates in Supabase
4. ✅ Add user profile management features
5. ✅ Implement subscription management
6. ✅ Add forgot password functionality
7. ✅ Set up monitoring and logging

## Support

For issues:
- Check Supabase logs
- Review browser console for errors
- Verify all environment variables are set
- Test with a fresh incognito browser session
