import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NetatmoStation {
  _id: string;
  place: {
    location: [number, number];
    altitude: number;
    timezone: string;
  };
  measures: Record<string, {
    type: string[];
    res: Record<string, number[]>;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lon = parseFloat(url.searchParams.get('lon') || '0');

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing latitude or longitude' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Netatmo Weather] Fetching data for:', { lat, lon });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Netatmo provider
    const { data: provider, error: providerError } = await supabase
      .from('weather_api_providers')
      .select('id, enabled')
      .eq('name', 'netatmo')
      .single();

    if (providerError || !provider) {
      console.error('[Netatmo Weather] Provider not found:', providerError);
      return new Response(
        JSON.stringify({ error: 'Netatmo provider not found' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!provider.enabled) {
      console.log('[Netatmo Weather] Provider is disabled');
      return new Response(
        JSON.stringify({ error: 'Netatmo provider is disabled' }),
        {
          status: 503,
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

    if (configError || !oauthConfig || !oauthConfig.access_token) {
      console.error('[Netatmo Weather] OAuth config not found or no token:', configError);
      return new Response(
        JSON.stringify({ error: 'OAuth not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token needs refresh
    const expiresAt = new Date(oauthConfig.token_expires_at);
    const now = new Date();
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log('[Netatmo Weather] Token expiring soon, triggering refresh...');
      
      // Call refresh token function
      const refreshUrl = `${supabaseUrl}/functions/v1/netatmo-refresh-token`;
      await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Re-fetch config with new token
      const { data: refreshedConfig } = await supabase
        .from('weather_oauth_config')
        .select('access_token')
        .eq('provider_id', provider.id)
        .single();

      if (refreshedConfig?.access_token) {
        oauthConfig.access_token = refreshedConfig.access_token;
      }
    }

    // Create bounding box (approximately 6km radius)
    const radius = 0.05; // ~5.5km in degrees
    const lat_ne = lat + radius;
    const lon_ne = lon + radius;
    const lat_sw = lat - radius;
    const lon_sw = lon - radius;

    console.log('[Netatmo Weather] Requesting public data with bounding box:', {
      lat_ne, lon_ne, lat_sw, lon_sw
    });

    // Fetch weather data from Netatmo
    const netatmoResponse = await fetch('https://api.netatmo.com/api/getpublicdata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${oauthConfig.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        lat_ne: lat_ne.toString(),
        lon_ne: lon_ne.toString(),
        lat_sw: lat_sw.toString(),
        lon_sw: lon_sw.toString(),
        filter: 'true',
      }).toString(),
    });

    if (!netatmoResponse.ok) {
      const errorText = await netatmoResponse.text();
      console.error('[Netatmo Weather] API request failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Netatmo API request failed', details: errorText }),
        {
          status: netatmoResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const netatmoData = await netatmoResponse.json();
    console.log('[Netatmo Weather] Received data from', netatmoData.body?.length || 0, 'stations');

    if (!netatmoData.body || netatmoData.body.length === 0) {
      console.log('[Netatmo Weather] No stations found in area');
      return new Response(
        JSON.stringify({ error: 'No weather stations found in area' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process and aggregate data from nearby stations
    const stations: NetatmoStation[] = netatmoData.body;
    let totalTemp = 0, totalPressure = 0, totalHumidity = 0;
    let totalRain = 0, totalWindSpeed = 0, totalWindDirection = 0;
    let tempCount = 0, pressureCount = 0, humidityCount = 0;
    let rainCount = 0, windCount = 0;

    for (const station of stations) {
      for (const [moduleId, module] of Object.entries(station.measures || {})) {
        const types = module.type || [];
        const latestTimestamp = Math.max(...Object.keys(module.res || {}).map(Number));
        const values = module.res[latestTimestamp] || [];

        types.forEach((type, index) => {
          const value = values[index];
          if (value === undefined || value === null) return;

          switch (type) {
            case 'temperature':
              totalTemp += value;
              tempCount++;
              break;
            case 'pressure':
              totalPressure += value;
              pressureCount++;
              break;
            case 'humidity':
              totalHumidity += value;
              humidityCount++;
              break;
            case 'rain':
              totalRain += value;
              rainCount++;
              break;
            case 'wind_strength':
              totalWindSpeed += value;
              windCount++;
              break;
            case 'wind_angle':
              totalWindDirection += value;
              break;
          }
        });
      }
    }

    // Calculate averages
    const weatherData = {
      temperature: tempCount > 0 ? Math.round(totalTemp / tempCount) : null,
      pressure: pressureCount > 0 ? Math.round(totalPressure / pressureCount) : null,
      humidity: humidityCount > 0 ? Math.round(totalHumidity / humidityCount) : null,
      precipitation: rainCount > 0 ? totalRain / rainCount : 0,
      windSpeed: windCount > 0 ? Math.round(totalWindSpeed / windCount) : null,
      windDirection: windCount > 0 ? Math.round(totalWindDirection / windCount) : null,
      stationCount: stations.length,
      source: 'netatmo',
    };

    console.log('[Netatmo Weather] Processed weather data:', weatherData);

    return new Response(
      JSON.stringify(weatherData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Netatmo Weather] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});