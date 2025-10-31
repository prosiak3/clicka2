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
    console.log('[Netatmo Token Refresh] Starting token refresh...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Netatmo provider
    const { data: provider, error: providerError } = await supabase
      .from('weather_api_providers')
      .select('id')
      .eq('name', 'netatmo')
      .single();

    if (providerError || !provider) {
      console.error('[Netatmo Token Refresh] Provider not found:', providerError);
      return new Response(
        JSON.stringify({ error: 'Netatmo provider not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get OAuth config
    const { data: oauthConfig, error: configError } = await supabase
      .from('weather_oauth_config')
      .select('*')
      .eq('provider_id', provider.id)
      .single();

    if (configError || !oauthConfig) {
      console.error('[Netatmo Token Refresh] OAuth config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'OAuth configuration not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!oauthConfig.refresh_token) {
      console.error('[Netatmo Token Refresh] No refresh token available');
      return new Response(
        JSON.stringify({ error: 'No refresh token available' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token needs refresh (expires within 5 minutes)
    const expiresAt = new Date(oauthConfig.token_expires_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt.getTime() - now.getTime() > fiveMinutes) {
      console.log('[Netatmo Token Refresh] Token still valid, no refresh needed');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Token still valid',
          expires_at: expiresAt.toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Netatmo Token Refresh] Refreshing token...');

    // Refresh the access token
    const tokenResponse = await fetch('https://api.netatmo.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: oauthConfig.refresh_token,
        client_id: oauthConfig.client_id,
        client_secret: oauthConfig.client_secret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Netatmo Token Refresh] Token refresh failed:', errorText);
      
      // Disable provider if refresh fails
      await supabase
        .from('weather_api_providers')
        .update({ enabled: false })
        .eq('id', provider.id);

      return new Response(
        JSON.stringify({ error: 'Token refresh failed', details: errorText }),
        {
          status: tokenResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('[Netatmo Token Refresh] New tokens received');

    // Calculate new expiry time
    const newExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update OAuth config with new tokens
    const { error: updateError } = await supabase
      .from('weather_oauth_config')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: newExpiresAt.toISOString(),
        last_token_refresh: new Date().toISOString(),
      })
      .eq('id', oauthConfig.id);

    if (updateError) {
      console.error('[Netatmo Token Refresh] Failed to save new tokens:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save tokens', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Netatmo Token Refresh] Token refresh completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token refreshed successfully',
        expires_at: newExpiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Netatmo Token Refresh] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});