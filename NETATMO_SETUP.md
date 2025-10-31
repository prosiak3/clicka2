# Netatmo Weather API - Setup Guide

## 🎯 Overview

This guide will help you configure Netatmo Weather API integration to get real-time weather data from nearby public weather stations.

---

## 📋 Prerequisites

- Active Netatmo account (create at https://auth.netatmo.com/register)
- Admin access to your fishing app
- Your Supabase URL (from `.env` file)

---

## 🔧 Step-by-Step Setup

### Step 1: Create Netatmo Application

1. Go to **https://dev.netatmo.com/apps**
2. Click **"Create"** or **"+ Create an app"**
3. Fill in the form:
   - **App name**: `Fishing Weather Tracker` (or any name you prefer)
   - **Description**: `Weather data integration for fishing app`
   - **Company**: Your name/company
   - **Data Protection Officer Email**: Your email
   - **Website**: Your Supabase URL (e.g., `https://your-project.supabase.co`)

4. **CRITICAL**: In the **Redirect URI** field, enter **EXACTLY**:
   ```
   https://czopkukjtdwpesebelcp.supabase.co/functions/v1/netatmo-oauth-callback
   ```

   ⚠️ **Important**: This must match EXACTLY. No trailing slash, no spaces.

5. **Scopes**: Make sure to enable:
   - ✅ `read_station` - Required to read public weather station data

6. Click **"Save"**

7. After saving, you'll see:
   - **Client ID** - Copy this (looks like: `67deb5d11023583e900542ad`)
   - **Client Secret** - Click "Show" and copy (looks like: `abc123...xyz789`)

---

### Step 2: Configure in Admin Panel

1. Log in to your fishing app as **Admin**

2. Navigate to: **Admin → Weather API**

3. Find the **"Netatmo Weather"** section

4. Click **"Configure"**

5. Paste your credentials:
   - **Client ID**: Paste from Step 1
   - **Client Secret**: Paste from Step 1
   - **Redirect URI**: Should be pre-filled (verify it matches Step 1.4)

6. Click **"Save"**

7. You should see: ✅ **"OAuth configuration saved successfully!"**

---

### Step 3: Connect Your Netatmo Account

1. After saving configuration, you'll see a button: **"Connect Netatmo Account"**

2. Click it - a popup window will open

3. **Log in to Netatmo** with your account credentials

4. You'll see a permission request screen:
   - App name: Your app name from Step 1
   - Permissions: Read weather station data

5. Click **"Accept"** or **"Allow"**

6. The popup should close automatically and show: ✅ **"Netatmo Connected!"**

7. Back in Admin panel, you should see:
   - Status: **✅ Connected**
   - Token expires: Date/time when token needs refresh (automatic)

---

## 🎉 Success!

Your app is now configured to use Netatmo weather data!

### What happens next:

```
When you start a fishing session:
  ↓
1. App tries Netatmo first (Priority 1)
   → Fetches data from nearby public stations (within ~5km radius)
   → Aggregates data from multiple stations for accuracy
   ↓
2. If Netatmo fails → Falls back to Open-Meteo (Priority 2)
   ↓
3. If both fail → Uses weather estimation
```

---

## 🔍 Troubleshooting

### Error: "Missing authorization header" (401)

**Possible causes:**

1. **Redirect URI mismatch**
   - Solution: Check that Redirect URI in Netatmo app matches EXACTLY:
     ```
     https://czopkukjtdwpesebelcp.supabase.co/functions/v1/netatmo-oauth-callback
     ```

2. **Wrong Client ID or Secret**
   - Solution: Double-check you copied the correct values
   - In dev.netatmo.com, click "Show" next to Client Secret and copy again

3. **Scope not enabled**
   - Solution: Go to dev.netatmo.com → Your App → Edit
   - Make sure `read_station` scope is checked

4. **App not active**
   - Solution: Go to dev.netatmo.com → Your App
   - Make sure app status is "Active" (not Draft or Disabled)

### Error: "No weather stations found in area"

This is normal if:
- You're in a remote area with no public Netatmo stations
- System will automatically fall back to Open-Meteo

### Provider stays "Disabled"

- Netatmo provider is disabled by default
- It becomes enabled ONLY after successful OAuth connection
- If OAuth fails, provider remains disabled (app uses Open-Meteo)

---

## 🔒 Security Notes

✅ **Client Secret is safe:**
- Stored in database with RLS (Row Level Security)
- Never exposed to frontend
- Only admins can view/edit

✅ **Tokens are managed automatically:**
- Access tokens refresh every 3 hours automatically
- No manual intervention needed
- If refresh fails, provider is disabled automatically

✅ **All API calls go through Edge Functions:**
- Your credentials never leave the server
- Frontend never sees sensitive data

---

## 📊 Data Provided by Netatmo

From nearby public stations, you get:

- 🌡️ **Temperature** (°C) - averaged from multiple stations
- 🌪️ **Atmospheric Pressure** (hPa) - averaged
- 💨 **Wind Speed** (km/h) - averaged
- 🧭 **Wind Direction** (degrees) - averaged
- 💧 **Humidity** (%) - averaged
- 🌧️ **Precipitation** (mm) - aggregated

**Benefits over Open-Meteo:**
- ✅ Real sensor data (not model predictions)
- ✅ Hyperlocal accuracy (5km radius)
- ✅ Updated every 10 minutes
- ✅ Multiple stations = better reliability

---

## ⚙️ Advanced: Token Refresh

Tokens expire every **3 hours**. The system handles this automatically:

1. Before each weather request, checks token expiry
2. If expiring within 5 minutes → triggers refresh
3. Refresh happens via Edge Function (secure)
4. New token saved to database
5. If refresh fails → provider disabled, falls back to Open-Meteo

**Manual refresh:**
- Not needed (fully automatic)
- If you want to test: Just wait for token to expire or restart session

---

## 🆘 Still Having Issues?

### Check the browser console:

1. Press `F12` → Console tab
2. Look for logs starting with `[Netatmo OAuth]`
3. Share the error messages

### Check Edge Function logs:

1. Go to Supabase Dashboard
2. Navigate to: Edge Functions → netatmo-oauth-callback
3. Check the logs for detailed error messages

### Verify your setup:

Run this in browser console on your app:
```javascript
const supabase = window.supabase;
const { data, error } = await supabase
  .from('weather_oauth_config')
  .select('client_id, is_configured, token_expires_at')
  .single();
console.log('OAuth Config:', data, error);
```

Should show:
- `client_id`: Your client ID
- `is_configured`: true (after successful connection)
- `token_expires_at`: Future date

---

## 📚 Resources

- **Netatmo Developer Portal**: https://dev.netatmo.com
- **Netatmo API Documentation**: https://dev.netatmo.com/apidocumentation/weather
- **OAuth 2.0 Docs**: https://dev.netatmo.com/apidocumentation/oauth

---

## ✅ Checklist

Before clicking "Connect Netatmo Account":

- [ ] Created app on dev.netatmo.com
- [ ] Set correct Redirect URI (exact match)
- [ ] Enabled `read_station` scope
- [ ] Copied Client ID and Secret correctly
- [ ] Saved configuration in Admin Panel
- [ ] Verified "Configured" status shows in UI

After clicking "Connect":

- [ ] Popup opened successfully
- [ ] Logged in to Netatmo
- [ ] Accepted permissions
- [ ] Popup closed with success message
- [ ] Status shows "Connected" in Admin Panel
- [ ] Provider is now "Enabled"

---

**Happy Fishing! 🎣**
