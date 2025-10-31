import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('[Netatmo OAuth] Callback received', { code: !!code, state, error });

    if (error) {
      console.error('[Netatmo OAuth] OAuth error:', error);
      return new Response(
        JSON.stringify({ error: 'OAuth failed', details: error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!code) {
      console.error('[Netatmo OAuth] No authorization code provided');
      return new Response(
        JSON.stringify({ error: 'No authorization code provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: provider, error: providerError } = await supabase
      .from('weather_api_providers')
      .select('id')
      .eq('name', 'netatmo')
      .single();

    if (providerError || !provider) {
      console.error('[Netatmo OAuth] Provider not found:', providerError);
      return new Response(
        JSON.stringify({ error: 'Netatmo provider not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: oauthConfig, error: configError } = await supabase
      .from('weather_oauth_config')
      .select('*')
      .eq('provider_id', provider.id)
      .single();

    if (configError || !oauthConfig) {
      console.error('[Netatmo OAuth] OAuth config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'OAuth configuration not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Netatmo OAuth] Exchanging code for tokens...');
    console.log('[Netatmo OAuth] Using redirect_uri:', oauthConfig.redirect_uri);
    console.log('[Netatmo OAuth] Using client_id:', oauthConfig.client_id);
    console.log('[Netatmo OAuth] Using scopes:', oauthConfig.scopes);

    const tokenResponse = await fetch('https://api.netatmo.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: oauthConfig.client_id,
        client_secret: oauthConfig.client_secret,
        code: code,
        redirect_uri: oauthConfig.redirect_uri,
        scope: (oauthConfig.scopes || []).join(' '),
      }).toString(),
    });

    console.log('[Netatmo OAuth] Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Netatmo OAuth] Token exchange failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Token exchange failed', details: errorText }),
        {
          status: tokenResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('[Netatmo OAuth] Tokens received successfully');

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    const { error: updateError } = await supabase
      .from('weather_oauth_config')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        is_configured: true,
        last_token_refresh: new Date().toISOString(),
      })
      .eq('id', oauthConfig.id);

    if (updateError) {
      console.error('[Netatmo OAuth] Failed to save tokens:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save tokens', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('weather_api_providers')
      .update({ enabled: true })
      .eq('id', provider.id);

    console.log('[Netatmo OAuth] OAuth setup completed successfully');

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Netatmo OAuth Success</title>
        <style>
          body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f0f0; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
          .success { color: #059669; font-size: 3rem; margin-bottom: 1rem; }
          h1 { color: #1f2937; margin: 0 0 0.5rem; }
          p { color: #6b7280; margin: 0.5rem 0; }
          button { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; margin-top: 1rem; }
          button:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success">✓</div>
          <h1>Netatmo Connected!</h1>
          <p>Your Netatmo account has been successfully connected.</p>
          <p>Weather data will now use Netatmo as the primary source.</p>
          <button onclick="window.close()">Close Window</button>
        </div>
        <script>
          setTimeout(() => { window.close(); }, 3000);
        </script>
      </body>
      </html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('[Netatmo OAuth] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});