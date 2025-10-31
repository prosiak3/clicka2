export function logPWAStatus() {
  console.group('PWA Installation Status');

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

  console.log('Manifest:', {
    link: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
    exists: !!document.querySelector('link[rel="manifest"]')
  });

  console.log('BeforeInstallPrompt:', {
    eventFired: 'beforeinstallprompt event will be logged when it fires'
  });

  const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
  if (dismissedTime) {
    const daysSince = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    console.log('User dismissed prompt:', {
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
