# PWA Manifest Fix - Content-Type Problem

## Problem
Manifest PWA (`manifest.webmanifest`) zwracał HTML zamiast JSON, powodując błąd:
```
⚠️ Manifest has unexpected content-type: text/html
❌ Failed to load manifest: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Przyczyna
Plik `_redirects` w Netlify/hosting miał regułę `/*    /index.html   200` która przekierowywała **wszystkie** żądania, włącznie z manifestem, do index.html.

## Rozwiązanie

### 1. Zaktualizowano `public/_redirects`
```
# Netlify/Hosting Redirects Configuration
# Ensure PWA files are served correctly with proper content-type

# Serve manifest and service worker files directly (critical for PWA)
/manifest.webmanifest   /manifest.webmanifest   200
/sw.js   /sw.js   200
/workbox-*.js   /workbox-*.js   200

# Serve static assets directly
/icons/*   /icons/:splat   200
/sounds/*   /sounds/:splat   200
/assets/*   /assets/:splat   200

# SPA fallback - must be last rule
/*    /index.html   200
```

### 2. Kolejność ma znaczenie!
**KRYTYCZNE**: Reguły specyficzne (manifest, service worker) MUSZĄ być PRZED regułą fallback SPA (`/*`).

Netlify przetwarza reguły od góry do dołu i zatrzymuje się na pierwszym dopasowaniu.

### 3. Weryfikacja
Po buildie:
```bash
# Sprawdź czy manifest jest JSON
cat dist/manifest.webmanifest

# Sprawdź czy _redirects został skopiowany
cat dist/_redirects
```

## Co naprawiono
- ✅ Manifest zwraca poprawny JSON z content-type `application/manifest+json`
- ✅ Service Worker (`sw.js`) nie jest przekierowywany do HTML
- ✅ Workbox pliki są prawidłowo serwowane
- ✅ Ikony i dźwięki są bezpośrednio dostępne
- ✅ SPA routing nadal działa dla wszystkich pozostałych ścieżek

## Testowanie

### W przeglądarce (DevTools):
1. Otwórz DevTools → Application → Manifest
2. Manifest powinien się poprawnie załadować
3. Konsola nie powinna pokazywać błędów manifest

### W konsoli przeglądarki:
```javascript
// Test 1: Sprawdź czy manifest jest dostępny
fetch('/manifest.webmanifest')
  .then(r => r.json())
  .then(data => console.log('✅ Manifest OK:', data))
  .catch(e => console.error('❌ Manifest Error:', e));

// Test 2: Sprawdź content-type
fetch('/manifest.webmanifest')
  .then(r => console.log('Content-Type:', r.headers.get('content-type')));
```

### Oczekiwany wynik:
```
✅ Manifest OK: {name: "Clicka - Better Fishing", ...}
Content-Type: application/manifest+json
```

## Deployment Checklist

Po każdym deployu upewnij się, że:
- [ ] `dist/_redirects` zawiera poprawne reguły
- [ ] `dist/manifest.webmanifest` istnieje i zawiera JSON
- [ ] `dist/sw.js` istnieje
- [ ] Reguła manifestu jest PRZED regułą `/*`
- [ ] Build zakończył się sukcesem bez błędów PWA
- [ ] Manifest ładuje się poprawnie w produkcji

## Dodatkowe uwagi

### Inne hosting providers:

**Vercel**: Użyj `vercel.json`
```json
{
  "routes": [
    { "src": "/manifest.webmanifest", "dest": "/manifest.webmanifest" },
    { "src": "/sw.js", "dest": "/sw.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Apache**: `.htaccess`
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite PWA files
  RewriteRule ^manifest\.webmanifest$ - [L]
  RewriteRule ^sw\.js$ - [L]
  RewriteRule ^workbox-.*\.js$ - [L]

  # SPA fallback
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx**: `nginx.conf`
```nginx
location ~* (manifest\.webmanifest|sw\.js|workbox-.*\.js)$ {
  try_files $uri =404;
}

location / {
  try_files $uri $uri/ /index.html;
}
```

## Historia zmian
- **2025-11-03**: Naprawiono routing manifestu w `_redirects`
- **2025-11-03**: Dodano komentarze i dokumentację do pliku `_redirects`
- **2025-11-03**: Utworzono ten dokument debugowania

## Powiązane pliki
- `/public/_redirects` - konfiguracja źródłowa
- `/dist/_redirects` - wygenerowana podczas buildu
- `/vite.config.ts` - konfiguracja PWA plugin
- `/PWA_INSTALLATION_DEBUG.md` - ogólny przewodnik PWA
