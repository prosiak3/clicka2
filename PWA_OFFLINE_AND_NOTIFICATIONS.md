# PWA - Tryb Offline i Powiadomienia Push

Aplikacja Clicka została w pełni skonfigurowana do działania w trybie offline oraz z obsługą powiadomień push.

## ✅ Tryb Offline

### Możliwości działania offline:

1. **Pełna funkcjonalność bez internetu**
   - Rozpoczynanie i kończenie sesji połowowych
   - Dodawanie złowionych ryb
   - Przeglądanie zapisanych danych
   - Dostęp do wszystkich ustawień
   - Mapy i wykresy

2. **Automatyczne cache'owanie**
   - Wszystkie pliki aplikacji (JS, CSS, HTML, ikony)
   - API pogodowe (1 godzina cache)
   - Dane z Supabase (5 minut cache)
   - Biblioteki zewnętrzne (CDN)

3. **Synchronizacja w tle**
   - Dane zapisują się lokalnie podczas offline
   - Automatyczna synchronizacja po przywróceniu połączenia
   - Kolejka żądań API w tle (Background Sync)

4. **Powiadomienia o statusie połączenia**
   - Alert gdy aplikacja przechodzi w tryb offline
   - Powiadomienie o przywróceniu połączenia
   - Wizualne wskaźniki w pasku statusu

### Jak to działa:

```
Internet dostępny:
├─ Normalna praca z bazą danych
├─ Świeże dane pogodowe
└─ Natychmiastowa synchronizacja

Internet niedostępny:
├─ Aplikacja działa z cache
├─ Dane zapisują się lokalnie
├─ Powiadomienie o trybie offline
└─ Kolejka operacji do synchronizacji

Internet przywrócony:
├─ Powiadomienie o połączeniu
├─ Automatyczna synchronizacja
└─ Aktualizacja danych
```

## 🔔 Powiadomienia Push

### Dostępne powiadomienia:

1. **Alerty pogodowe**
   - Idealne warunki do połowu
   - Zmiany ciśnienia atmosferycznego
   - Ostrzeżenia o złej pogodzie

2. **Przypomnienia o połowach**
   - Zapisanie ostatniego połowu
   - Zakończenie aktywnej sesji

3. **Powiadomienia systemowe**
   - Tryb offline/online
   - Ostrzeżenie o automatycznym zakończeniu sesji
   - Aktualizacje aplikacji

### Konfiguracja powiadomień:

#### Krok 1: Przejdź do Ustawień
W aplikacji kliknij ikonę ⚙️ (Settings)

#### Krok 2: Rozwiń sekcję "Notifications"
Znajdziesz tam kontrolki do zarządzania powiadomieniami

#### Krok 3: Zezwól na powiadomienia
- Kliknij przycisk "Zezwól na powiadomienia"
- Przeglądarka pokaże dialog z prośbą o zgodę
- Zaakceptuj zezwolenie

#### Krok 4: Aktywuj subskrypcję
- Po udzieleniu zgody, kliknij "Aktywuj powiadomienia"
- System zarejestruje urządzenie do otrzymywania push notifications

#### Krok 5: Wybierz typy powiadomień
- ✅ Włącz powiadomienia (master switch)
- ✅ Alerty pogodowe
- ✅ Przypomnienia o połowach

### Status powiadomień:

**🟡 Zablokowane (żółty banner)**
```
Powiadomienia są zablokowane w przeglądarce.
Kliknij "Zezwól na powiadomienia" aby je włączyć.
```

**🔵 Wymagana subskrypcja (niebieski banner)**
```
Masz zezwolenie, ale brak aktywnej subskrypcji.
Kliknij "Aktywuj powiadomienia" aby włączyć push.
```

**🟢 Aktywne (zielony banner)**
```
✓ Powiadomienia aktywne
  Otrzymasz alerty i przypomnienia
```

### Testowanie powiadomień:

Możesz przetestować powiadomienia programistycznie:

```javascript
// W konsoli przeglądarki:

// Test podstawowego powiadomienia
import { showNotification } from './utils/notifications';
await showNotification({
  title: 'Test',
  body: 'To jest testowe powiadomienie!'
});

// Test alertu pogodowego
import { showWeatherAlertNotification } from './utils/notifications';
await showWeatherAlertNotification('Idealne warunki - temperatura 18°C, ciśnienie stabilne');

// Test przypomnienia
import { showCatchReminderNotification } from './utils/notifications';
await showCatchReminderNotification();
```

## 🔧 Konfiguracja zaawansowana (opcjonalna)

### Dodanie kluczy VAPID dla pełnych push notifications:

Push notifications działają w podstawowej formie lokalnej. Aby otrzymywać powiadomienia z serwera (np. przez Supabase Edge Functions), musisz skonfigurować klucze VAPID.

#### Generowanie kluczy VAPID:

1. **Odwiedź:** https://vapidkeys.com/
   Lub użyj biblioteki `web-push`:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Dodaj klucz publiczny do `.env`:**
   ```env
   VITE_VAPID_PUBLIC_KEY=twój-klucz-publiczny-vapid
   ```

3. **Klucz prywatny zapisz bezpiecznie** (np. w Supabase Edge Function secrets)

4. **Przebuduj aplikację:**
   ```bash
   npm run build
   ```

## 📱 Kompatybilność platform:

### Tryb Offline:
- ✅ Android Chrome - Pełne wsparcie
- ✅ iOS Safari - Pełne wsparcie
- ✅ Windows Edge/Chrome - Pełne wsparcie
- ✅ macOS Safari/Chrome - Pełne wsparcie
- ✅ Linux Chrome - Pełne wsparcie

### Push Notifications:
- ✅ Android Chrome - Pełne wsparcie
- ⚠️ iOS Safari - Tylko lokalne (brak background push od iOS 16.4+)
- ✅ Windows Edge/Chrome - Pełne wsparcie
- ✅ macOS Safari/Chrome - Pełne wsparcie
- ✅ Linux Chrome - Pełne wsparcie

**Uwaga iOS:** Safari na iOS obsługuje tylko powiadomienia gdy aplikacja jest otwarta. Background push jest ograniczony przez system.

## 🐛 Rozwiązywanie problemów

### Powiadomienia nie działają:

1. **Sprawdź uprawnienia w przeglądarce:**
   - Chrome: Ustawienia → Prywatność i bezpieczeństwo → Ustawienia witryn → Powiadomienia
   - Safari: Preferencje → Strony internetowe → Powiadomienia
   - Firefox: Ustawienia → Prywatność i bezpieczeństwo → Uprawnienia → Powiadomienia

2. **Sprawdź czy Service Worker jest zarejestrowany:**
   - DevTools → Application → Service Workers
   - Powinna być aktywna wersja `sw.js`

3. **Sprawdź czy subskrypcja jest aktywna:**
   ```javascript
   // W konsoli:
   const reg = await navigator.serviceWorker.ready;
   const sub = await reg.pushManager.getSubscription();
   console.log('Subscription:', sub);
   ```

### Tryb offline nie działa:

1. **Sprawdź cache:**
   - DevTools → Application → Cache Storage
   - Powinny być cache: `workbox-precache`, `weather-api-cache`, `supabase-cache`

2. **Wymuś aktualizację Service Workera:**
   - DevTools → Application → Service Workers → Update
   - Lub wyczyść cache i przeładuj stronę

3. **Sprawdź logi:**
   - Konsola powinna pokazać: "App ready to work offline"
   - Przy utracie połączenia: "App is now offline"

## 📊 Monitorowanie cache:

Aplikacja automatycznie zarządza cache:
- **Maksymalny rozmiar pliku:** 5 MB
- **Weather API cache:** 50 wpisów, 1 godzina
- **Supabase cache:** 100 wpisów, 5 minut
- **CDN cache:** 50 wpisów, 1 rok
- **Automatyczne czyszczenie:** Stare wpisy są usuwane

## 🚀 Najlepsze praktyki:

1. **Regularnie synchronizuj dane** gdy masz połączenie
2. **Nie blokuj powiadomień** - są niezbędne do alertów
3. **Aktualizuj aplikację** gdy pojawi się powiadomienie o nowej wersji
4. **Monitoruj status** w prawym górnym rogu (ikony statusu)
5. **Używaj PWA w trybie standalone** (zainstalowana aplikacja)

## ✨ Funkcje przyszłości:

- [ ] Inteligentne powiadomienia o idealnych warunkach połowowych
- [ ] Grupowe powiadomienia dla lokalnych wędkarzy
- [ ] Push notifications z prognozy rybackiej
- [ ] Offline maps z caching
- [ ] Background sync zaawansowany (retry logic)

---

**Aplikacja Clicka jest w pełni funkcjonalna offline! 🎣**

Możesz łowić ryby nawet bez dostępu do internetu, a wszystkie dane zostaną automatycznie zsynchronizowane gdy połączenie zostanie przywrócone.
