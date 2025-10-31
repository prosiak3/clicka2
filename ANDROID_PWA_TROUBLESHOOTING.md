# Android PWA Installation Troubleshooting Guide

## Table of Contents
1. [Common Causes of Installation Failures](#common-causes)
2. [Quick Diagnostic Checklist](#quick-diagnostic)
3. [Step-by-Step Diagnostic Process](#step-by-step)
4. [Browser-Specific Solutions](#browser-specific)
5. [Android System Settings](#android-settings)
6. [Manifest File Requirements](#manifest-requirements)
7. [Service Worker Configuration](#service-worker)
8. [Alternative Installation Methods](#alternative-methods)
9. [Prevention and Best Practices](#prevention)
10. [Advanced Debugging](#advanced-debugging)

---

## Common Causes of Installation Failures {#common-causes}

### 1. **HTTPS Requirement (Most Common Issue)**
- **Symptom**: No install prompt appears, even after multiple visits
- **Cause**: PWAs REQUIRE HTTPS (except localhost)
- **Impact**: 80% of installation failures
- **Quick Fix**: Deploy to hosting with HTTPS (Netlify, Vercel, etc.)

### 2. **Engagement Heuristics Not Met**
- **Symptom**: Everything looks correct, but no install prompt
- **Cause**: Chrome requires user engagement before showing prompt
- **Requirements**:
  - At least 2 site visits
  - Minimum 5 minutes between visits
  - User spent sufficient time on site OR bookmarked it

### 3. **Invalid Manifest File**
- **Symptom**: Chrome DevTools shows manifest errors
- **Cause**: Missing required fields or incorrect icon paths
- **Common Issues**:
  - Missing `name` or `short_name`
  - No icons with size 192x192 and 512x512
  - Invalid `start_url` or `scope`

### 4. **Service Worker Issues**
- **Symptom**: Service Worker fails to register
- **Cause**: Syntax errors, scope problems, or HTTPS issues
- **Check**: Chrome DevTools → Application → Service Workers

### 5. **App Already Installed**
- **Symptom**: No install prompt shown
- **Cause**: PWA is already installed on device
- **Check**: Android Settings → Apps → See all apps → Clicka

### 6. **Browser Cache/Storage Issues**
- **Symptom**: Intermittent installation problems
- **Cause**: Corrupted cache or storage quota exceeded
- **Fix**: Clear browser data and try again

---

## Quick Diagnostic Checklist {#quick-diagnostic}

Run through this checklist before detailed troubleshooting:

```
☐ App is served over HTTPS (or localhost for dev)
☐ Valid manifest.webmanifest file exists
☐ Manifest includes icons (192x192 and 512x512 minimum)
☐ Service Worker is registered and active
☐ You've visited the site at least 2 times with 5+ min gap
☐ Chrome version is 68+ (check: chrome://version)
☐ App is NOT already installed
☐ No manifest or service worker errors in DevTools
☐ Icons are accessible (not 404)
☐ Using Chrome or compatible browser (not Firefox on Android)
```

---

## Step-by-Step Diagnostic Process {#step-by-step}

### Step 1: Verify HTTPS

**On Desktop:**
```bash
# Check if site is HTTPS
curl -I https://your-app-url.com | grep -i "http"
```

**On Mobile:**
1. Open your PWA in Chrome
2. Check address bar - should show 🔒 (lock icon)
3. If you see "Not secure", HTTPS is missing

**Solution:**
- Deploy to: Netlify, Vercel, GitHub Pages, Firebase Hosting
- All provide free automatic HTTPS

### Step 2: Check Manifest File

**Via Chrome DevTools (Desktop):**
1. Open your PWA in Chrome
2. Press F12 → Application tab → Manifest
3. Look for warnings/errors in yellow/red

**Via Remote Debugging (Mobile):**
1. Connect Android device via USB
2. Enable USB debugging on phone: Settings → Developer options → USB debugging
3. On desktop Chrome: `chrome://inspect`
4. Click "Inspect" next to your device
5. Go to Application → Manifest

**Expected Results:**
```json
{
  "name": "Clicka - Better Fishing",
  "short_name": "Clicka",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Common Manifest Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "No matching service worker detected" | SW not registered | Check service worker registration |
| "start_url is not within scope" | Invalid scope | Set `scope: "/"` in manifest |
| "Icon could not be fetched" | 404 on icon file | Verify icon paths and hosting |
| "Manifest URL changed" | Manifest cached with old URL | Clear cache and reload |

### Step 3: Verify Service Worker

**Check Registration:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
  registrations.forEach(reg => {
    console.log('SW Scope:', reg.scope);
    console.log('SW Active:', reg.active?.state);
  });
});
```

**Expected Output:**
```
Service Workers: [ServiceWorkerRegistration]
SW Scope: https://your-app.com/
SW Active: activated
```

**If Service Worker is Missing:**
1. Check DevTools → Application → Service Workers
2. Click "Update" to force re-registration
3. Check for JavaScript errors in Console tab

**Common Service Worker Errors:**

| Error | Solution |
|-------|----------|
| "SecurityError: Failed to register" | Must be HTTPS or localhost |
| "Syntax error in service worker" | Check SW file for JS errors |
| "Scope is not allowed" | SW must be at root or scope must be set correctly |
| "Service worker registration failed" | Check network tab for 404 errors |

### Step 4: Test Install Prompt

**In Browser Console:**
```javascript
// Check if beforeinstallprompt event is available
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt event fired!');
  e.preventDefault();
  deferredPrompt = e;
});

// Wait 10 seconds, then check
setTimeout(() => {
  if (deferredPrompt) {
    console.log('✅ Install prompt is ready!');
    deferredPrompt.prompt();
  } else {
    console.log('❌ No install prompt captured');
    console.log('Possible reasons:');
    console.log('1. App already installed');
    console.log('2. Not enough user engagement');
    console.log('3. Missing HTTPS');
    console.log('4. Manifest or SW issues');
  }
}, 10000);
```

### Step 5: Check Engagement Criteria

**Bypass Engagement (Testing Only):**

Chrome flags to disable engagement checks:
```bash
# Desktop Chrome
chrome --disable-features=AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies

# Android Chrome (via ADB)
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main \
  --es "disable-features" "AppBannerTriggering"
```

**Manual Engagement Test:**
1. Visit your PWA
2. Interact for 30+ seconds (scroll, click)
3. Close browser completely
4. Wait 5 minutes
5. Return to PWA
6. Interact again for 30+ seconds
7. Install prompt should appear

---

## Browser-Specific Solutions {#browser-specific}

### Chrome for Android (Recommended)

**Version Requirements:**
- Chrome 68+ for basic PWA support
- Chrome 73+ for maskable icons
- Chrome 89+ for Shortcuts API

**Check Version:**
1. Chrome menu → Settings → About Chrome
2. Or visit: `chrome://version`

**Installation Path:**
1. Open PWA in Chrome
2. Wait for banner (or tap menu → "Install app")
3. Confirm installation
4. App appears on home screen and app drawer

**If "Install app" not in menu:**
- Verify HTTPS ✓
- Check manifest is valid ✓
- Ensure 192x192 and 512x512 icons exist ✓
- Meet engagement criteria ✓

**Chrome-Specific Fixes:**

```javascript
// Force Chrome to re-check installability
// In browser console:
localStorage.clear();
sessionStorage.clear();
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
location.reload();
```

### Samsung Internet Browser

**Version Requirements:**
- Samsung Internet 5.0+ for basic PWA support
- Samsung Internet 12.0+ recommended

**Known Issues:**
- More strict installability criteria
- May not show prompt even when criteria met
- Manual install via menu is more reliable

**Installation Path:**
1. Open PWA in Samsung Internet
2. Menu → "Add page to" → "Home screen"
3. Select "Install app" (if available) instead of "Bookmark"

**Samsung-Specific Fix:**
```javascript
// Add this meta tag to HTML
<meta name="mobile-web-app-capable" content="yes">
```

### Firefox for Android

**⚠️ Important:** Firefox for Android does NOT fully support PWA installation as of 2024.

**What Works:**
- Adding to home screen (creates bookmark)
- Service Worker functionality
- Offline capabilities

**What Doesn't Work:**
- Standalone display mode
- App-like experience
- Native install prompt

**Workaround:**
Direct users to Chrome or Samsung Internet for full PWA experience.

### Microsoft Edge for Android

**Works Similar to Chrome:**
- Edge uses Chromium engine
- Supports all PWA features
- Installation process identical to Chrome

**Edge-Specific Benefits:**
- Syncs with Windows 10/11 Edge
- Can install on Windows from mobile

### Brave Browser

**Full PWA Support:**
- Based on Chromium
- Same features as Chrome
- More privacy-focused

**Installation:** Same as Chrome

---

## Android System Settings {#android-settings}

### Enable App Installation from Unknown Sources

**Android 8.0+:**
1. Settings → Apps & notifications → Special app access
2. Install unknown apps
3. Select your browser (Chrome)
4. Enable "Allow from this source"

**Android 7.0 and older:**
1. Settings → Security
2. Enable "Unknown sources"

### Storage Permissions

**If installation fails with storage error:**
1. Settings → Apps → Chrome → Permissions
2. Enable "Storage" permission
3. Clear app cache
4. Retry installation

### Battery Optimization

**PWAs may be killed if battery optimization is aggressive:**
1. Settings → Battery → Battery optimization
2. Select "All apps"
3. Find "Clicka" or your PWA
4. Select "Don't optimize"

### Data Saver Mode

**Can interfere with PWA installation:**
1. Settings → Network & internet → Data Saver
2. Temporarily disable
3. Install PWA
4. Re-enable if needed

### Chrome Flags (Advanced)

**Access:** `chrome://flags` in Chrome address bar

**Useful Flags for PWA:**

| Flag | Purpose | Recommendation |
|------|---------|----------------|
| `#enable-webapk` | Enable WebAPK installation | Enabled (default) |
| `#enable-improved-a2hs` | Better Add to Home Screen | Enabled |
| `#enable-ambient-badge-on-menu` | Show install badge in menu | Enabled |
| `#bypass-app-banner-engagement-checks` | Skip engagement checks | Testing only |

**To Enable a Flag:**
1. Visit `chrome://flags`
2. Search for flag name
3. Select "Enabled" from dropdown
4. Restart Chrome

---

## Manifest File Requirements {#manifest-requirements}

### Minimum Required Fields

```json
{
  "name": "Your App Full Name",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

### Recommended Additional Fields

```json
{
  "description": "App description for app stores",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "categories": ["sports", "utilities"],
  "icons": [
    {
      "src": "/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Display Modes

| Mode | Description | When to Use |
|------|-------------|-------------|
| `standalone` | Full-screen, no browser UI | Recommended (app-like) |
| `fullscreen` | Covers entire screen | Games, immersive apps |
| `minimal-ui` | Minimal browser controls | Hybrid approach |
| `browser` | Regular browser tab | Web-first apps |

### Icon Requirements

**Mandatory Sizes:**
- 192x192 (standard)
- 512x512 (high-res)

**Recommended Additional Sizes:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 384x384

**Maskable Icons:**
- Add icons with `purpose: "maskable"`
- Keep important content in center 80% (safe zone)
- Use solid background color

**Icon Format:**
- PNG (recommended)
- SVG (good for simple logos)
- WebP (modern browsers)

**Icon Checklist:**
```
☐ Icons are square (1:1 aspect ratio)
☐ Transparent OR solid background (no alpha channel issues)
☐ High contrast for visibility
☐ Recognizable at small sizes
☐ No text smaller than 8pt
☐ All icon URLs return 200 OK (not 404)
```

### Manifest Validation Tools

**Online Validators:**
1. **Manifest Generator:** https://www.simicart.com/manifest-generator.html
2. **PWA Builder:** https://www.pwabuilder.com/
3. **Web.dev Measure:** https://web.dev/measure/

**Manual Validation:**
```bash
# Check manifest is accessible
curl -I https://your-app.com/manifest.webmanifest

# Should return:
HTTP/2 200
content-type: application/manifest+json
```

---

## Service Worker Configuration {#service-worker}

### Basic Service Worker Template

```javascript
// sw.js
const CACHE_NAME = 'clicka-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icon-192x192.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

### Service Worker Registration

```javascript
// In your main app.js or index.html
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ SW registration failed:', error);
      });
  });
}
```

### Common Service Worker Issues

**Issue 1: Service Worker Not Updating**
```javascript
// Force update
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((registration) => {
    registration.update();
  });
});
```

**Issue 2: Scope Problems**
```javascript
// Register with explicit scope
navigator.serviceWorker.register('/sw.js', { scope: '/' });
```

**Issue 3: Cache Not Clearing**
```javascript
// Clear all caches
caches.keys().then((names) => {
  names.forEach((name) => {
    caches.delete(name);
  });
});
```

### Debugging Service Workers

**Chrome DevTools:**
1. F12 → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister" to remove SW
4. Click "Update" to force update

**Console Logging:**
```javascript
// In service worker
console.log('SW Event:', event.type);
console.log('Request:', event.request.url);
```

---

## Alternative Installation Methods {#alternative-methods}

### Method 1: Chrome Menu Installation

**Most Reliable for Android:**
1. Open PWA in Chrome
2. Tap 3-dot menu (⋮)
3. Select "Install app" or "Add to Home screen"
4. Confirm installation

**Advantages:**
- Works even without install prompt
- Manual trigger
- No engagement requirements

### Method 2: Settings Button Installation

**Your App Has This Built-in:**
1. Open Clicka app
2. Tap Settings icon (⚙️)
3. Scroll to "Instalacja Aplikacji" section
4. Tap "Zainstaluj aplikację" button
5. Follow platform-specific instructions

### Method 3: Add to Home Screen (Fallback)

**If PWA Install Fails:**
1. Chrome menu → "Add to Home screen"
2. This creates a bookmark, not full PWA
3. Better than nothing, but missing features:
   - No offline support
   - No standalone mode
   - Opens in browser

**Upgrade Later:**
- When criteria met, Chrome will offer full installation
- User can upgrade bookmark to full PWA

### Method 4: Web Share Target

**If Your App Implements Share Target:**
1. Share something to your PWA
2. Android may offer to install the app
3. Works as trigger for installation

### Method 5: QR Code Installation

**For Easy Sharing:**
1. Generate QR code for your PWA URL
2. Users scan QR code
3. Opens in Chrome automatically
4. Install prompt appears if criteria met

**QR Code Generators:**
- https://qr-code-generator.com/
- https://www.qrcode-monkey.com/

### Method 6: Deep Link Installation

**Create Install Link:**
```html
<!-- Add to your website -->
<a href="intent://your-app.com#Intent;scheme=https;package=com.android.chrome;end">
  Install Clicka App
</a>
```

This opens your PWA in Chrome on Android, triggering install flow.

---

## Prevention and Best Practices {#prevention}

### 1. Pre-Deployment Checklist

**Before Launching Your PWA:**
```
☐ Test on real Android devices (not just emulator)
☐ Verify HTTPS certificate is valid
☐ Test on multiple browsers (Chrome, Samsung, Edge)
☐ Check manifest with Chrome DevTools
☐ Verify all icons load without 404 errors
☐ Test offline functionality
☐ Validate manifest with online tools
☐ Test installation flow end-to-end
☐ Check service worker activation
☐ Verify theme_color matches app design
```

### 2. Manifest Best Practices

```json
{
  "name": "Full App Name (max 45 chars)",
  "short_name": "Short Name (max 12 chars)",
  "description": "Clear description of app features",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#ffffff",
  "theme_color": "#your-brand-color",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 3. Performance Optimization

**Fast Load Times Improve Installability:**
- Lighthouse score 90+ (green)
- First Contentful Paint < 1.8s
- Time to Interactive < 3.8s
- Total bundle size < 1MB

**Test Performance:**
```bash
# Using Lighthouse CLI
npm install -g @lhci/cli
lhci autorun --url=https://your-app.com
```

### 4. User Engagement Strategy

**Encourage Installation:**
- Show value proposition clearly
- Offer install button in UI
- Explain benefits of installing
- Timing: Show prompt after user sees value

**Don't:**
- Show install prompt immediately
- Be too aggressive with prompts
- Block content until installed
- Spam users with install requests

### 5. Monitoring and Analytics

**Track Installation Metrics:**
```javascript
// Track beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Analytics tracking
  gtag('event', 'pwa_install_prompt_shown', {
    'event_category': 'PWA',
    'event_label': 'Install Prompt Shown'
  });
});

// Track successful installation
window.addEventListener('appinstalled', (evt) => {
  gtag('event', 'pwa_installed', {
    'event_category': 'PWA',
    'event_label': 'App Installed Successfully'
  });
});
```

### 6. Update Strategy

**Smooth Updates:**
```javascript
// In your service worker
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// In your app
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Show "Update available" message
  if (confirm('New version available! Reload to update?')) {
    window.location.reload();
  }
});
```

### 7. Error Handling

**Graceful Degradation:**
```javascript
// Check PWA support
const isPWASupported = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

if (!isPWASupported()) {
  console.warn('PWA features not fully supported');
  // Provide fallback experience
}
```

---

## Advanced Debugging {#advanced-debugging}

### Remote Debugging (Android + Desktop)

**Setup:**
1. Enable Developer Options on Android:
   - Settings → About phone
   - Tap "Build number" 7 times
2. Enable USB Debugging:
   - Settings → Developer options
   - Toggle "USB debugging" ON
3. Connect phone via USB cable
4. Accept "Allow USB debugging" prompt on phone

**Debug Process:**
1. Open Chrome on desktop
2. Navigate to `chrome://inspect#devices`
3. Select your device from list
4. Click "Inspect" next to your PWA
5. Full DevTools access to mobile browser

**What You Can Debug:**
- Console logs
- Network requests
- Service Worker state
- Cache contents
- Manifest validation
- JavaScript errors
- Performance profiling

### Lighthouse PWA Audit

**Run Lighthouse:**
1. Chrome DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Generate report"

**PWA Checklist Items:**
```
☐ Registers a service worker
☐ Responds with 200 when offline
☐ Has a <meta name="viewport"> tag
☐ Contains some content when JS unavailable
☐ Provides a valid apple-touch-icon
☐ Configured for a custom splash screen
☐ Sets a theme color
☐ Content is sized correctly for viewport
☐ Has a <meta name="theme-color"> tag
☐ Provides a valid manifest
☐ Redirects HTTP to HTTPS
☐ Accessible over HTTPS
```

### Network Simulation

**Test on Slow Connections:**
1. Chrome DevTools → Network tab
2. Throttling dropdown → "Slow 3G"
3. Test PWA performance and installation

### Storage Inspection

**Check Cache and Storage:**
```javascript
// Check cache size
navigator.storage.estimate().then((estimate) => {
  console.log('Usage:', estimate.usage / 1024 / 1024, 'MB');
  console.log('Quota:', estimate.quota / 1024 / 1024, 'MB');
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2), '%');
});

// List all caches
caches.keys().then((names) => {
  console.log('Caches:', names);
  names.forEach((name) => {
    caches.open(name).then((cache) => {
      cache.keys().then((keys) => {
        console.log(`${name}:`, keys.length, 'items');
      });
    });
  });
});
```

### ADB (Android Debug Bridge) Commands

**Useful ADB Commands:**
```bash
# Check if device connected
adb devices

# Clear Chrome data
adb shell pm clear com.android.chrome

# View logcat (Android system logs)
adb logcat | grep -i "chromium"

# Take screenshot
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Force stop Chrome
adb shell am force-stop com.android.chrome

# Launch Chrome with URL
adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main \
  -d "https://your-app.com"

# Grant storage permission
adb shell pm grant com.android.chrome android.permission.WRITE_EXTERNAL_STORAGE
```

### Chrome Custom Tabs Debugging

**If PWA Opens in Custom Tab Instead of Standalone:**
```javascript
// Check display mode
const checkDisplayMode = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

  console.log({
    isStandalone,
    isFullscreen,
    isMinimalUI,
    isBrowser: !isStandalone && !isFullscreen && !isMinimalUI
  });
};

checkDisplayMode();
```

### WebAPK Inspection

**Check if PWA Installed as WebAPK:**
```bash
# List installed WebAPKs
adb shell pm list packages | grep webapk

# Get package info
adb shell dumpsys package org.chromium.webapk.YOUR_APP_ID

# Force update WebAPK
adb shell am start -n com.android.chrome/org.chromium.chrome.browser.webapps.WebApkActivity
```

### Manifest Update Testing

**Force Manifest Update:**
```javascript
// Manifest updates check every 24 hours
// To force check:
caches.delete('manifest-cache'); // If you cache manifest
location.reload();

// Or wait 24 hours for automatic check
```

### Performance Profiling

**Record Performance:**
```javascript
// Performance API
const perfData = performance.getEntriesByType('navigation')[0];
console.log('Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
console.log('First Paint:', performance.getEntriesByName('first-paint')[0].startTime, 'ms');

// Service Worker Performance
navigator.serviceWorker.ready.then((registration) => {
  console.log('SW Activation Time:', performance.now(), 'ms');
});
```

---

## Testing Checklist

**Before Declaring Success:**
```
☐ Install on real Android device (not emulator)
☐ Verify offline functionality works
☐ Check icon appears correctly on home screen
☐ Test app opens in standalone mode (no browser UI)
☐ Verify theme color applies correctly
☐ Test on different Android versions (9, 10, 11, 12+)
☐ Test on different browsers (Chrome, Samsung, Edge)
☐ Verify updates work correctly
☐ Test uninstall and reinstall
☐ Check all features work in installed app
☐ Verify no console errors
☐ Test on slow network connections
☐ Verify splash screen displays correctly
☐ Test all PWA features (push notifications, background sync, etc.)
```

---

## Quick Reference: Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Service worker registration failed" | HTTPS required | Deploy to HTTPS hosting |
| "Manifest: property 'icons' invalid" | Missing or wrong icon format | Add 192x192 and 512x512 icons |
| "No matching service worker" | SW not registered | Check SW registration code |
| "Site cannot be installed" | Criteria not met | Check manifest, HTTPS, SW, engagement |
| "net::ERR_FAILED loading manifest" | 404 or CORS issue | Verify manifest URL and CORS headers |
| "Manifest start_url not within scope" | Scope mismatch | Set scope to "/" |
| "beforeinstallprompt not firing" | Already installed or criteria not met | Uninstall app and meet criteria |

---

## Support and Resources

**Official Documentation:**
- [web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Chrome PWA Install Criteria](https://web.dev/install-criteria/)

**Testing Tools:**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Validator](https://manifest-validator.appspot.com/)

**Community:**
- Stack Overflow: [pwa] tag
- Reddit: r/PWA
- Chrome Developers Discord

**Your Project:**
- See `PWA_INSTALLATION_DEBUG.md` for project-specific instructions
- See `PWA_IOS_VS_ANDROID.md` for platform comparisons

---

**Last Updated:** October 2024
**Clicka PWA Version:** 1.0.0
