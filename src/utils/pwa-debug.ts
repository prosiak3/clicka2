export async function logPWAStatus() {
  console.group('🔍 PWA Installation Status');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isAndroid = /android/.test(window.navigator.userAgent.toLowerCase());

  console.log('Platform:', {
    isIOS,
    isAndroid,
    userAgent: navigator.userAgent
  });

  console.log('Display Mode:', {
    isStandalone,
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
  });

  console.log('Service Worker:', {
    supported: 'serviceWorker' in navigator,
    controller: navigator.serviceWorker?.controller,
    ready: navigator.serviceWorker?.ready
  });

  const manifestLink = document.querySelector('link[rel="manifest"]');
  console.log('Manifest:', {
    link: manifestLink?.getAttribute('href'),
    exists: !!manifestLink
  });

  // Fetch and validate manifest
  if (manifestLink) {
    try {
      const manifestUrl = manifestLink.getAttribute('href');
      const response = await fetch(manifestUrl!);
      const manifest = await response.json();
      console.log('✅ Manifest loaded:', manifest);

      // Check if icons are accessible
      if (manifest.icons && manifest.icons.length > 0) {
        console.log('Checking icon accessibility...');
        const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
        if (icon192) {
          try {
            const iconResponse = await fetch(icon192.src);
            console.log(`✅ Icon 192x192 accessible: ${icon192.src} (${iconResponse.status})`);
          } catch (e) {
            console.error(`❌ Icon 192x192 NOT accessible: ${icon192.src}`, e);
          }
        }
      }
    } catch (e) {
      console.error('❌ Failed to load manifest:', e);
    }
  }

  console.log('HTTPS:', {
    isSecure: window.location.protocol === 'https:',
    protocol: window.location.protocol,
    origin: window.location.origin
  });

  console.log('BeforeInstallPrompt:', {
    eventFired: 'beforeinstallprompt event will be logged when it fires'
  });

  const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
  if (dismissedTime) {
    const daysSince = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    console.log('⚠️ User dismissed prompt:', {
      dismissed: true,
      daysAgo: daysSince.toFixed(2)
    });
  }

  console.groupEnd();
}

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎉 beforeinstallprompt event fired!', e);
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed successfully!');
});
