# OAuth Setup Instructions

This guide will help you configure OAuth authentication for Google and Apple ID in your Clicka fishing app.

## Prerequisites

- A Supabase project (already configured)
- Access to Google Cloud Console
- Access to Apple Developer Account (for Apple ID)

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your authorized redirect URIs:
   ```
   https://czopkukjtdwpesebelcp.supabase.co/auth/v1/callback
   ```
7. Copy your Client ID and Client Secret

### Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and enable it
4. Paste your Google Client ID
5. Paste your Google Client Secret
6. Click "Save"

### Step 3: Add Authorized Domains (Optional)

If you're using a custom domain:
1. In Google Cloud Console, go to "OAuth consent screen"
2. Add your domain to "Authorized domains"

## 2. Apple ID OAuth Setup

### Step 1: Create Apple Services ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Click on "Identifiers" and create a new "Services ID"
4. Note your Services ID (this will be your Client ID)
5. Configure "Sign in with Apple":
   - Add your website URL
   - Add redirect URL:
     ```
     https://czopkukjtdwpesebelcp.supabase.co/auth/v1/callback
     ```

### Step 2: Create Private Key

1. In Apple Developer Portal, go to "Keys"
2. Create a new key and enable "Sign in with Apple"
3. Download the private key file (.p8)
4. Note the Key ID

### Step 3: Configure Apple OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to "Authentication" > "Providers"
3. Find "Apple" and enable it
4. Enter your Services ID (Client ID)
5. Upload your private key file or paste its contents
6. Enter your Key ID
7. Enter your Team ID (found in Apple Developer Portal)
8. Click "Save"

## 3. Testing OAuth Flow

### Test Google Sign In

1. Start your app
2. Navigate to the login screen
3. Click "Continue with Google"
4. Complete Google sign-in
5. You should be redirected back to your app

### Test Apple Sign In

1. Start your app
2. Navigate to the login screen
3. Click "Continue with Apple"
4. Complete Apple sign-in
5. You should be redirected back to your app

## 4. Production Deployment

When deploying to production:

1. Update OAuth redirect URIs in both Google and Apple consoles
2. Add your production domain to Supabase allowed redirect URLs:
   - Go to Authentication > URL Configuration
   - Add your production URL to "Redirect URLs"

## Troubleshooting

### Google OAuth Issues

- **"Redirect URI mismatch"**: Ensure the redirect URI in Google Console exactly matches the Supabase callback URL
- **"Access blocked"**: Add test users in OAuth consent screen (for unverified apps)

### Apple OAuth Issues

- **"Invalid client"**: Verify your Services ID is correctly configured
- **"Invalid key"**: Ensure the private key file is correctly uploaded to Supabase
- **"Domain not verified"**: Add and verify your domain in Apple Developer Portal

### General Issues

- Clear browser cache and cookies
- Check browser console for error messages
- Verify all credentials are correctly entered in Supabase
- Ensure your Supabase project URL matches in all configurations

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for sensitive data
- Regularly rotate API keys and secrets
- Enable 2FA on Google and Apple developer accounts
- Review OAuth consent scopes regularly

## Support

For additional help:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
