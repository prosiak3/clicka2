import React, { useState, useEffect } from 'react';
import { Cloud, Plus, Trash2, Save, Key, ArrowUp, ArrowDown, Power } from 'lucide-react';
import { supabase } from '../utils/db';

interface WeatherApiProvider {
  id: string;
  name: string;
  display_name: string;
  api_url: string;
  requires_key: boolean;
  enabled: boolean;
  priority: number;
}

interface WeatherApiKey {
  id: string;
  provider_id: string;
  api_key: string;
}

export function AdminWeatherApiScreen() {
  const [providers, setProviders] = useState<WeatherApiProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<WeatherApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<{ providerId: string; key: string } | null>(null);

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

      setProviders(providersData || []);
      setApiKeys(keysData || []);
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

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Configure weather API providers and their priority order. The system will try each enabled provider
            in order until it gets a successful response. This ensures weather data is always available even if
            one provider is down.
          </p>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => {
            const providerKey = apiKeys.find(k => k.provider_id === provider.id);
            const isEditing = editingKey?.providerId === provider.id;

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
                    </div>
                    <p className="text-sm text-gray-600">{provider.api_url}</p>
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

                {provider.requires_key && (
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
