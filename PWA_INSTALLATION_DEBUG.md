# Debugowanie Instalacji PWA na Androidzie i iOS

## Co zostało zaimplementowane:

### Dla Androida:
1. **Automatyczny banner instalacji PWA** - Pojawi się po 2 sekundach od załadowania strony
2. **Przycisk instalacji w Ustawieniach** - Zawsze dostępny backup dla użytkowników
3. **Debug logging** - Szczegółowe logi w konsoli przeglądarki

### Dla iOS (iPhone/iPad):
1. **Dedykowany banner z instrukcjami** - Pojawi się po 3 sekundach, zawiera krok po kroku instrukcję
2. **Przycisk w Ustawieniach** - Z automatycznym wykrywaniem iOS i wyświetlaniem instrukcji
3. **Optymalizacja dla Safari** - Wszystkie wymagane meta tagi i ikony
4. **Standalone mode** - Aplikacja uruchomi się w pełnym ekranie bez paska Safari

## Wymagania dla instalacji PWA na Androidzie:

### 1. HTTPS
- **KRYTYCZNE**: Aplikacja MUSI być dostępna przez HTTPS
- Localhost działa bez HTTPS tylko w trybie deweloperskim
- Aby przetestować na telefonie, musisz:
  - Wdrożyć aplikację na hosting z HTTPS (np. Netlify, Vercel, GitHub Pages)
  - LUB użyć narzędzia jak ngrok do utworzenia tunelu HTTPS

### 2. Service Worker
- ✅ Zaimplementowany i działający
- Sprawdź w DevTools: Application → Service Workers

### 3. Manifest
- ✅ Zaktualizowany z poprawnymi ikonami i scope
- ✅ Poprawiona konfiguracja _redirects dla właściwego content-type
- Sprawdź w DevTools: Application → Manifest
- **WAŻNE**: Plik `_redirects` musi zawierać regułę dla manifestu PRZED regułą SPA fallback

### 4. Engagement heuristics
Chrome na Androidzie wymaga:
- Użytkownik odwiedził stronę co najmniej 2 razy
- Z przerwą co najmniej 5 minut między wizytami
- Strona jest dodana do zakładek LUB użytkownik spędził na niej wystarczająco dużo czasu

## Jak sprawdzić czy instalacja działa:

### Na Androidzie (Chrome):

1. **Otwórz aplikację przez HTTPS na telefonie**
2. **Otwórz Chrome DevTools na komputerze:**
   - Podłącz telefon USB
   - W Chrome wpisz: `chrome://inspect`
   - Znajdź swoją stronę i kliknij "Inspect"

3. **W konsoli sprawdź logi:**
   ```javascript
   // Automatycznie wyświetli się po załadowaniu:
   PWA Installation Status
   - Platform: { isAndroid: true, ... }
   - Display Mode: { isStandalone: false }
   - Service Worker: { supported: true, ... }
   - Manifest: { exists: true }
   ```

4. **Sprawdź czy event się wywołał:**
   ```
   🎉 beforeinstallprompt event fired!
   ```

   Jeśli NIE widzisz tego eventu:
   - Sprawdź czy jesteś na HTTPS
   - Sprawdź czy spełniasz engagement heuristics
   - Sprawdź Application → Manifest w DevTools

### Wymuś wyświetlenie bannera (tylko dla testów):

W konsoli przeglądarki:
```javascript
// Wyczyść historię odrzuceń
localStorage.removeItem('pwa-install-dismissed');
localStorage.removeItem('pwa-install-dismissed-time');

// Odśwież stronę
location.reload();
```

### Alternatywne metody instalacji:

#### 1. Menu Chrome (3 kropki)
Jeśli spełniasz wszystkie wymagania, w menu Chrome pojawi się opcja:
- "Dodaj do ekranu głównego"
- "Zainstaluj aplikację"

#### 2. Przycisk w Ustawieniach
Zawsze możesz użyć przycisku w sekcji:
**Ustawienia → Instalacja Aplikacji**

## Częste problemy:

### Banner się nie pojawia:
1. **Sprawdź HTTPS**: PWA wymaga HTTPS (除く localhost)
2. **Sprawdź manifest**: DevTools → Application → Manifest
3. **Sprawdź SW**: DevTools → Application → Service Workers
4. **Wyczyść cache**: Application → Clear storage
5. **Sprawdź engagement**: Odwiedź stronę 2x z przerwą 5 min

### Event `beforeinstallprompt` się nie wywołuje:
- Aplikacja może być już zainstalowana
- Użytkownik odrzucił instalację niedawno
- Nie spełnione wymagania HTTPS/manifest/SW
- Chrome nie wykrył wystarczającego engagement

### Aplikacja zainstalowana ale ikony nieprawidłowe:
- Wyczyść cache aplikacji i przeinstaluj
- Sprawdź czy ikony są dostępne przez HTTPS

## Test lokalny z HTTPS (opcjonalne):

### Używając ngrok:
```bash
# Zainstaluj ngrok
npm install -g ngrok

# Wystartuj dev server
npm run dev

# W drugim terminalu
ngrok http 5173
```

Użyj URL HTTPS z ngrok na telefonie.

### Używając mkcert (dla sieci lokalnej):
```bash
# Zainstaluj mkcert
brew install mkcert  # macOS
# lub
choco install mkcert # Windows

# Utwórz certyfikat
mkcert -install
mkcert localhost 192.168.1.x  # Twój lokalny IP
```

## Produkcyjne wdrożenie:

Najlepsze opcje z darmowym HTTPS:
- **Netlify**: Automatyczne HTTPS, drag & drop deploy
- **Vercel**: Automatyczne HTTPS, integracja z Git
- **GitHub Pages**: Darmowy hosting, HTTPS dla *.github.io

Po wdrożeniu na hosting z HTTPS, instalacja PWA powinna działać automatycznie po spełnieniu engagement heuristics!

## Debug na żywo:

### Android:
Po wdrożeniu, otwórz konsolę na telefonie (przez chrome://inspect) i sprawdź:
1. Czy wszystkie logi PWA są zielone
2. Czy event `beforeinstallprompt` się wywołał
3. Czy banner się pokazuje po 2 sekundach

### iOS (iPhone/iPad):
1. **Wymagania**:
   - HTTPS (obowiązkowe, localhost nie działa)
   - Przeglądarka Safari (Chrome/Firefox NIE działają dla instalacji PWA na iOS)
   - iOS 11.3 lub nowszy

2. **Jak zainstalować**:
   - Otwórz aplikację w Safari
   - Banner z instrukcjami pojawi się automatycznie po 3 sekundach
   - LUB przejdź do Ustawienia → Instalacja Aplikacji i kliknij przycisk

3. **Ograniczenia iOS**:
   - Brak automatycznego promptu instalacji (wymaga ręcznej akcji)
   - Brak powiadomień push
   - Cache może być wyczyszczony po ~7 dniach nieużywania
   - Instalacja działa TYLKO w Safari (nie w Chrome/Firefox)

4. **Testowanie na iOS**:
   - Podłącz iPhone do Maca
   - Otwórz Safari → Develop → [Twój iPhone] → [Twoja strona]
   - Sprawdź konsolę czy banner iOS się pokazuje

5. **Wyczyść test**:
   ```javascript
   localStorage.removeItem('ios-pwa-install-dismissed');
   localStorage.removeItem('ios-pwa-install-dismissed-time');
   location.reload();
   ```
