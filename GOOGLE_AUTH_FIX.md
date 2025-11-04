# 🔧 Google Auth Fix - Step-by-Step Guide

This guide will help you fix Google Authentication in your app.

## 🎯 Quick Diagnosis

Run this command to check your setup:
```bash
node scripts/test-google-auth.js
```

---

## ✅ Step 1: Enable Google OAuth in Supabase

### Method A: Quick Setup (Development Only)

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard
   - Select your project: **rhbqgquapitkwazhqpdc**

2. Navigate to: **Authentication → Providers**

3. Find **Google** in the list and toggle it **ON**

4. For development, you can use Supabase's default OAuth (no extra configuration needed)

5. Click **Save**

✅ **This is the fastest way to test if Google Auth works**

---

### Method B: Production Setup (Recommended)

For production apps, you should use your own Google OAuth credentials:

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it: "VidDazzle" or your app name
   - Click "Create"

3. **Enable Google+ API** (Required for OAuth)
   - Navigate to: **APIs & Services → Library**
   - Search for: "Google+ API"
   - Click on it
   - Click **Enable**

4. **Create OAuth 2.0 Credentials**
   - Go to: **APIs & Services → Credentials**
   - Click: **Create Credentials → OAuth 2.0 Client ID**

5. **Configure OAuth Consent Screen** (if prompted)
   - User Type: **External** (unless you have Google Workspace)
   - App name: **VidDazzle** (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Skip for now, click **Save and Continue**
   - Test users: Add your email for testing
   - Click **Save and Continue**

6. **Create OAuth Client**
   - Application type: **Web application**
   - Name: **VidDazzle Web Client**

7. **Add Authorized JavaScript Origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```

8. **Add Authorized Redirect URIs:**
   ```
   https://rhbqgquapitkwazhqpdc.supabase.co/auth/v1/callback
   ```
   ⚠️ **Important**: Use YOUR project reference (rhbqgquapitkwazhqpdc is yours)

9. Click **Create**

10. **Copy Your Credentials:**
    - Client ID: `something.apps.googleusercontent.com`
    - Client Secret: `GOCSPX-something`

#### 2. Add Credentials to Supabase

1. Go back to: **Supabase Dashboard → Authentication → Providers**

2. Find **Google** and click to expand

3. Enable the provider

4. Paste:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)

5. Click **Save**

---

## ✅ Step 2: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to: **Authentication → URL Configuration**

2. Set **Site URL**:
   ```
   http://localhost:3000
   ```

3. Add **Redirect URLs** (click "+ Add URL" for each):
   ```
   http://localhost:3000/app
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

4. For production, also add:
   ```
   https://your-domain.com/app
   https://your-domain.com/**
   ```

5. Click **Save**

---

## ✅ Step 3: Test Google Auth

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Sign in with Google"**

4. **Expected behavior:**
   - New window/tab opens
   - Google account selection appears
   - After selecting account, redirects back to your app
   - You're logged in and redirected to `/app`

---

## 🐛 Troubleshooting

### Issue: "Invalid provider" error

**Cause:** Google provider not enabled in Supabase

**Fix:**
- Go to Supabase → Authentication → Providers
- Make sure Google is toggled ON
- Click Save

---

### Issue: "Redirect URI mismatch" error

**Cause:** The redirect URI in Google Cloud Console doesn't match Supabase's callback URL

**Fix:**
1. Check your Supabase project reference: `rhbqgquapitkwazhqpdc`
2. The callback URL must be EXACTLY:
   ```
   https://rhbqgquapitkwazhqpdc.supabase.co/auth/v1/callback
   ```
3. Go to Google Cloud Console → Credentials
4. Edit your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", make sure the URL matches EXACTLY
6. Save and try again (may take a few minutes to propagate)

---

### Issue: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured

**Fix:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Fill out required fields:
   - App name
   - User support email
   - Developer contact email
3. Add your email as a test user
4. Publish the app (or keep it in testing mode)

---

### Issue: Button clicks but nothing happens

**Cause:** JavaScript error or popup blocked

**Fix:**
1. Open browser console (F12)
2. Look for errors
3. Check if popup blocker is preventing the OAuth window
4. Allow popups for localhost:3000
5. Try again

---

### Issue: "Site URL not found" error

**Cause:** Site URL not configured in Supabase

**Fix:**
1. Go to Supabase → Authentication → URL Configuration
2. Set Site URL to: `http://localhost:3000`
3. Save and try again

---

### Issue: Redirects to wrong page after login

**Cause:** Redirect URL configuration

**Fix:**
1. Check Supabase → Authentication → URL Configuration
2. Make sure `http://localhost:3000/app` is in Redirect URLs
3. Check the code in `src/pages/login.jsx` line 67:
   ```javascript
   redirectTo: `${window.location.origin}/app`
   ```

---

## 🧪 Testing Checklist

- [ ] Google provider enabled in Supabase
- [ ] Site URL configured: `http://localhost:3000`
- [ ] Redirect URLs added in Supabase
- [ ] Google OAuth credentials added (for production setup)
- [ ] Redirect URI added in Google Cloud Console (for production setup)
- [ ] App running at `http://localhost:3000`
- [ ] Can click "Sign in with Google"
- [ ] Google account selector appears
- [ ] Successfully redirected back to `/app` after login
- [ ] No errors in browser console

---

## 📞 Still Having Issues?

1. **Check browser console** (F12) for detailed error messages
2. **Check Supabase logs**: Dashboard → Authentication → Logs
3. **Run diagnostic**: `node scripts/test-google-auth.js`
4. **Verify environment**: Check `.env.local` has correct Supabase URL and keys

---

## 🚀 Quick Start for Testing (Fastest Method)

If you just want to test quickly:

1. **Supabase Dashboard**:
   - Enable Google provider (no credentials needed)
   - Set Site URL: `http://localhost:3000`
   - Add Redirect URL: `http://localhost:3000/app`

2. **Terminal**:
   ```bash
   npm run dev
   ```

3. **Browser**:
   - Go to http://localhost:3000/login
   - Click "Sign in with Google"
   - Select your Google account

✅ Should work immediately with Supabase's default OAuth!

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
