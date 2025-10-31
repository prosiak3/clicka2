import React, { useState, useEffect } from 'react';
import { Cloud, Plus, Trash2, Save, Key, ArrowUp, ArrowDown, Power, ExternalLink, CheckCircle, AlertCircle, Clock, Activity, Settings } from 'lucide-react';
import { supabase } from '../utils/db';

interface WeatherApiProvider {
  id: string;
  name: string;
  display_name: string;
  api_url: string;
  requires_key: boolean;
  enabled: boolean;
  priority: number;
  last_sync_at: string | null;
  last_successful_sync_at: string | null;
  sync_interval_minutes: number;
  sync_error_count: number;
  last_sync_error: string | null;
}

interface WeatherApiKey {
  id: string;
  provider_id: string;
  api_key: string;
}

interface OAuthConfig {
  id: string;
  provider_id: string;
  client_id: string;
  client_secret: string;
  is_configured: boolean;
  token_expires_at: string | null;
  last_token_refresh: string | null;
  last_data_fetch_at: string | null;
  redirect_uri: string;
  scopes: string[];
}

export function AdminWeatherApiScreen() {
  const [providers, setProviders] = useState<WeatherApiProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<WeatherApiKey[]>([]);
  const [oauthConfigs, setOauthConfigs] = useState<OAuthConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<{ providerId: string; key: string } | null>(null);
  const [editingOAuth, setEditingOAuth] = useState<{ providerId: string; clientId: string; clientSecret: string; redirectUri: string } | null>(null);
  const [editingSyncInterval, setEditingSyncInterval] = useState<{ providerId: string; interval: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: providersData, error: providersError } = await supabase
        .from('weather_api_providers')
        .select('*')
        .order('priority', { ascending: true });

      if (providersError) throw providersError;

      const { data: keysData, error: keysError } = await supabase
        .from('weather_api_keys')
        .select('*');

      if (keysError) throw keysError;

      const { data: oauthData, error: oauthError } = await supabase
        .from('weather_oauth_config')
        .select('*');

      if (oauthError) console.error('Error loading OAuth configs:', oauthError);

      setProviders(providersData || []);
      setApiKeys(keysData || []);
      setOauthConfigs(oauthData || []);
    } catch (error) {
      console.error('Error loading weather API data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (provider: WeatherApiProvider) => {
    try {
      const { error } = await supabase
        .from('weather_api_providers')
        .update({ enabled: !provider.enabled })
        .eq('id', provider.id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  };

  const changePriority = async (provider: WeatherApiProvider, direction: 'up' | 'down') => {
    const newPriority = direction === 'up' ? provider.priority - 1 : provider.priority + 1;

    if (newPriority < 1) return;

    try {
      const { error } = await supabase
        .from('weather_api_providers')
        .update({ priority: newPriority })
        .eq('id', provider.id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error changing priority:', error);
    }
  };

  const saveApiKey = async (providerId: string, apiKey: string) => {
    try {
      const existingKey = apiKeys.find(k => k.provider_id === providerId);

      if (existingKey) {
        const { error } = await supabase
          .from('weather_api_keys')
          .update({ api_key: apiKey })
          .eq('id', existingKey.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('weather_api_keys')
          .insert({ provider_id: providerId, api_key: apiKey });

        if (error) throw error;
      }

      setEditingKey(null);
      await loadData();
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const saveOAuthConfig = async (providerId: string, clientId: string, clientSecret: string, redirectUri: string) => {
    try {
      if (!clientId || !clientSecret) {
        alert('Client ID and Client Secret are required');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const finalRedirectUri = redirectUri || `${supabaseUrl}/functions/v1/netatmo-oauth-callback`;

      const existingConfig = oauthConfigs.find(c => c.provider_id === providerId);

      if (existingConfig) {
        const { error } = await supabase
          .from('weather_oauth_config')
          .update({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: finalRedirectUri
          })
          .eq('id', existingConfig.id);

        if (error) {
          console.error('Error updating OAuth config:', error);
          alert(`Failed to save: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('weather_oauth_config')
          .insert({
            provider_id: providerId,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: finalRedirectUri,
            scopes: ['read_station']
          });

        if (error) {
          console.error('Error inserting OAuth config:', error);
          alert(`Failed to save: ${error.message}`);
          return;
        }
      }

      setEditingOAuth(null);
      await loadData();
      alert('OAuth configuration saved successfully!');
    } catch (error) {
      console.error('Error saving OAuth config:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startOAuthFlow = (provider: WeatherApiProvider) => {
    const oauthConfig = oauthConfigs.find(c => c.provider_id === provider.id);
    if (!oauthConfig || !oauthConfig.client_id) {
      alert('Please configure Client ID and Client Secret first');
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const authUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${oauthConfig.client_id}&redirect_uri=${encodeURIComponent(`${supabaseUrl}/functions/v1/netatmo-oauth-callback`)}&scope=read_station&state=auth`;

    window.open(authUrl, '_blank', 'width=600,height=700');

    setTimeout(() => {
      loadData();
    }, 5000);
  };

  const saveSyncInterval = async (providerId: string, intervalMinutes: number) => {
    try {
      if (intervalMinutes < 1) {
        alert('Sync interval must be at least 1 minute');
        return;
      }

      const { error } = await supabase
        .from('weather_api_providers')
        .update({ sync_interval_minutes: intervalMinutes })
        .eq('id', providerId);

      if (error) throw error;

      setEditingSyncInterval(null);
      await loadData();
    } catch (error) {
      console.error('Error saving sync interval:', error);
    }
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Weather API Configuration</h1>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg space-y-3">
          <p className="text-sm text-gray-700">
            Configure weather API providers and their priority order. The system will try each enabled provider
            in order until it gets a successful response. This ensures weather data is always available even if
            one provider is down.
          </p>
          <div className="border-t border-blue-200 pt-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Available Weather Services:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Netatmo:</strong> Real-time data from nearby public weather stations. Requires OAuth authentication with your Netatmo account.</li>
              <li><strong>Open-Meteo:</strong> Free, open-source weather API. No API key required. Provides temperature, pressure, wind, clouds, and precipitation data.</li>
            </ul>
          </div>
          <div className="border-t border-blue-200 pt-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Provided Weather Data:</h4>
            <ul className="text-sm text-gray-700 grid grid-cols-2 gap-1">
              <li>• Temperature</li>
              <li>• Atmospheric Pressure</li>
              <li>• Wind Speed & Direction</li>
              <li>• Cloud Cover (Low/Mid/High)</li>
              <li>• Precipitation</li>
              <li>• Humidity</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => {
            const providerKey = apiKeys.find(k => k.provider_id === provider.id);
            const oauthConfig = oauthConfigs.find(c => c.provider_id === provider.id);
            const isEditing = editingKey?.providerId === provider.id;
            const isEditingOAuth = editingOAuth?.providerId === provider.id;
            const isEditingSyncInt = editingSyncInterval?.providerId === provider.id;
            const isNetatmo = provider.name === 'netatmo';
            const isConnected = isNetatmo ? oauthConfig?.is_configured : !provider.requires_key || !!providerKey;
            const hasRecentSync = provider.last_successful_sync_at &&
              (new Date().getTime() - new Date(provider.last_successful_sync_at).getTime()) < provider.sync_interval_minutes * 60000 * 2;

            return (
              <div
                key={provider.id}
                className={`border rounded-lg p-4 ${
                  provider.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{provider.display_name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        Priority: {provider.priority}
                      </span>
                      {!provider.requires_key && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          Free
                        </span>
                      )}
                      {isConnected && (
                        <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                          hasRecentSync
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          <Activity className="w-3 h-3" />
                          {hasRecentSync ? 'Active' : 'Idle'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{provider.api_url}</p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last sync: {formatTimeAgo(provider.last_successful_sync_at)}</span>
                      </div>
                      {isNetatmo && oauthConfig?.last_data_fetch_at && (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>Last data: {formatTimeAgo(oauthConfig.last_data_fetch_at)}</span>
                        </div>
                      )}
                      {provider.sync_error_count > 0 && (
                        <span className="text-red-600 font-medium">
                          {provider.sync_error_count} error{provider.sync_error_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changePriority(provider, 'up')}
                      disabled={provider.priority === 1}
                      className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Increase priority"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => changePriority(provider, 'down')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Decrease priority"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => toggleProvider(provider)}
                      className={`p-2 rounded-lg ${
                        provider.enabled
                          ? 'bg-green-100 hover:bg-green-200'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      title={provider.enabled ? 'Disable' : 'Enable'}
                    >
                      <Power
                        className={`w-4 h-4 ${provider.enabled ? 'text-green-600' : 'text-gray-600'}`}
                      />
                    </button>
                  </div>
                </div>

                {isNetatmo && (
                  <div className="mt-3 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">OAuth Configuration</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Create an app at <a href="https://dev.netatmo.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">dev.netatmo.com/apps</a> to get your credentials.
                      </p>
                      {isEditingOAuth ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingOAuth.clientId}
                            onChange={(e) =>
                              setEditingOAuth({ ...editingOAuth, clientId: e.target.value })
                            }
                            placeholder="Client ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="password"
                            value={editingOAuth.clientSecret}
                            onChange={(e) =>
                              setEditingOAuth({ ...editingOAuth, clientSecret: e.target.value })
                            }
                            placeholder="Client Secret"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={editingOAuth.redirectUri}
                            onChange={(e) =>
                              setEditingOAuth({ ...editingOAuth, redirectUri: e.target.value })
                            }
                            placeholder="Redirect URI (use Edge Function URL)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <p className="text-xs text-gray-500">
                            Redirect URI: <code className="bg-gray-100 px-1 py-0.5 rounded">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/netatmo-oauth-callback</code>
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                saveOAuthConfig(provider.id, editingOAuth.clientId, editingOAuth.clientSecret, editingOAuth.redirectUri)
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingOAuth(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {oauthConfig?.client_id ? (
                                <span className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  Configured
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                  Not configured
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() =>
                                setEditingOAuth({
                                  providerId: provider.id,
                                  clientId: oauthConfig?.client_id || '',
                                  clientSecret: oauthConfig?.client_secret || '',
                                  redirectUri: oauthConfig?.redirect_uri || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/netatmo-oauth-callback`
                                })
                              }
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {oauthConfig ? 'Edit' : 'Configure'}
                            </button>
                          </div>
                          {oauthConfig?.is_configured && (
                            <div className="pt-2 border-t border-gray-200 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Status:</span>
                                <span className="text-green-600 font-medium">Connected</span>
                              </div>
                              {oauthConfig.token_expires_at && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Token expires:</span>
                                  <span className="text-gray-700">{new Date(oauthConfig.token_expires_at).toLocaleString()}</span>
                                </div>
                              )}
                              {oauthConfig.last_token_refresh && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Last refresh:</span>
                                  <span className="text-gray-700">{formatTimeAgo(oauthConfig.last_token_refresh)}</span>
                                </div>
                              )}
                              <div className="pt-2 border-t border-blue-200 mt-2">
                                <div className="flex items-center gap-1 text-xs text-blue-700">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium">Auto-refresh: Active</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  Token refreshes automatically every hour
                                </p>
                              </div>
                            </div>
                          )}
                          {oauthConfig && !oauthConfig.is_configured && (
                            <button
                              onClick={() => startOAuthFlow(provider)}
                              className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Connect Netatmo Account
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {provider.requires_key && !isNetatmo && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">API Key</span>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingKey.key}
                          onChange={(e) =>
                            setEditingKey({ providerId: provider.id, key: e.target.value })
                          }
                          placeholder="Enter API key"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => saveApiKey(provider.id, editingKey.key)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {providerKey ? '••••••••••••••••' : 'No API key configured'}
                        </span>
                        <button
                          onClick={() =>
                            setEditingKey({ providerId: provider.id, key: providerKey?.api_key || '' })
                          }
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {providerKey ? 'Edit' : 'Add Key'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Sync Frequency</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    How often to fetch weather data from this provider (in minutes)
                  </p>
                  {isEditingSyncInt ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={editingSyncInterval.interval}
                        onChange={(e) =>
                          setEditingSyncInterval({
                            providerId: provider.id,
                            interval: parseInt(e.target.value) || 1
                          })
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                      <button
                        onClick={() => saveSyncInterval(provider.id, editingSyncInterval.interval)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSyncInterval(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Every <strong>{provider.sync_interval_minutes}</strong> minute{provider.sync_interval_minutes !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() =>
                          setEditingSyncInterval({
                            providerId: provider.id,
                            interval: provider.sync_interval_minutes
                          })
                        }
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {provider.last_sync_error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">Last Error</span>
                    </div>
                    <p className="text-xs text-red-700">{provider.last_sync_error}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Changes take effect immediately. Make sure at least one provider is enabled
            and properly configured to ensure continuous weather data availability.
          </p>
        </div>
      </div>
    </div>
  );
}
