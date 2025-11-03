// Middleware to ensure manifest.webmanifest is served with correct content-type
export function vitePwaMiddleware() {
  return {
    name: 'vite-pwa-manifest-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/manifest.webmanifest') {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.setHeader('Cache-Control', 'no-cache');
        } else if (req.url === '/sw.js' || req.url?.startsWith('/workbox-')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Service-Worker-Allowed', '/');
        }
        next();
      });
    }
  };
}
