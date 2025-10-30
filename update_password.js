const supabaseUrl = 'https://czopkukjtdwpesebelcp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6b3BrdWtqdGR3cGVzZWJlbGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzIxNTMsImV4cCI6MjA3NzM0ODE1M30.FQqbaouJwFcxSMQiFVy57QO3gmgFPzQ-lLwUG0PuqcQ';

async function updatePassword() {
  try {
    // Logujemy się jako użytkownik którego hasło chcemy zmienić
    const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WRONG_PASSWORD_TO_GENERATE_MAGIC_LINK'
      })
    });

    console.log('To nie zadziała przez API...');
    
    // Alternatywa: Utworzymy nowe konto z tym samym emailem po usunięciu starego
    console.log('\nNajlepsze rozwiązanie: Utwórz nowe konto w aplikacji z innymi danymi:');
    console.log('Email: test2@example.com');
    console.log('Hasło: test123456');
    
  } catch (error) {
    console.error('Błąd:', error);
  }
}

updatePassword();
