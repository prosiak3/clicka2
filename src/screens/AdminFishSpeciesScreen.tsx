import React, { useState, useEffect } from 'react';
import { Fish, Plus, Edit, Trash2, Save, X, Image, AlertCircle, Download, Loader } from 'lucide-react';
import { supabase } from '../utils/db';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface FishSpecies {
  id: string;
  code: string;
  name_en: string;
  name_pl: string;
  name_de: string;
  latin_name: string;
  group_name: string;
  min_length: number;
  max_length: number;
  max_weight: number;
  description_pl?: string;
  description_en?: string;
  description_de?: string;
  habitat_pl?: string;
  habitat_en?: string;
  habitat_de?: string;
  feeding_pl?: string;
  feeding_en?: string;
  feeding_de?: string;
  spawning_pl?: string;
  spawning_en?: string;
  spawning_de?: string;
  image_url?: string;
  thumbnail_url?: string;
  legal_size?: number;
  protected_period_start?: string;
  protected_period_end?: string;
  created_at: string;
  updated_at: string;
}

type InputMode = 'manual' | 'import';
type LanguageTab = 'pl' | 'en' | 'de';

export function AdminFishSpeciesScreen() {
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FishSpecies>>({});
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [importUrl, setImportUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [languageTab, setLanguageTab] = useState<LanguageTab>('pl');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadSpecies();
  }, []);

  const loadSpecies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('fish_species')
        .select('*')
        .order('name_en');

      if (error) throw error;
      setSpecies(data || []);
    } catch (err) {
      console.error('Failed to load species:', err);
      setError('Failed to load fish species');
    } finally {
      setIsLoading(false);
    }
  };

  const startCreate = () => {
    setFormData({
      code: '',
      name_en: '',
      name_pl: '',
      name_de: '',
      latin_name: '',
      group_name: 'freshwater',
      min_length: 10,
      max_length: 100,
      max_weight: 10,
      description_pl: '',
      description_en: '',
      description_de: '',
      habitat_pl: '',
      habitat_en: '',
      habitat_de: '',
      feeding_pl: '',
      feeding_en: '',
      feeding_de: '',
      spawning_pl: '',
      spawning_en: '',
      spawning_de: '',
      image_url: '',
      thumbnail_url: '',
      legal_size: 0,
      protected_period_start: undefined,
      protected_period_end: undefined
    });
    setIsCreating(true);
    setEditingId(null);
    setInputMode('manual');
    setImportUrl('');
    setFetchSuccess(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      setError(null);

      const fishCode = formData.code || formData.name_pl
        ?.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/[^a-z0-9]/g, '')
        || 'fish';

      const fileName = `${fishCode}-${Date.now()}.${file.name.split('.').pop()}`;

      const { data, error: uploadError } = await supabase.storage
        .from('fish-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('fish-images')
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        image_url: publicUrlData.publicUrl,
        thumbnail_url: publicUrlData.publicUrl,
      });

    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!formData.image_url) return;

    try {
      setError(null);

      const urlParts = formData.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      if (fileName && formData.image_url.includes('fish-images')) {
        const { error: deleteError } = await supabase.storage
          .from('fish-images')
          .remove([fileName]);

        if (deleteError) {
          console.error('Failed to delete from storage:', deleteError);
        }
      }

      setFormData({
        ...formData,
        image_url: '',
        thumbnail_url: '',
      });

    } catch (err: any) {
      console.error('Failed to delete image:', err);
      setError(err.message || 'Failed to delete image');
    }
  };

  const fetchDataFromUrl = async () => {
    if (!importUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      setIsFetching(true);
      setError(null);
      setFetchSuccess(false);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-fish-data`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const fetchedData = result.data;

        const code = fetchedData.name_pl
          ? fetchedData.name_pl.toLowerCase()
              .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
              .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
              .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
              .replace(/[^a-z0-9]/g, '')
          : '';

        setFormData({
          code: code || formData.code || '',
          name_en: fetchedData.name_en || formData.name_en || '',
          name_pl: fetchedData.name_pl || formData.name_pl || '',
          name_de: fetchedData.name_de || formData.name_de || '',
          latin_name: fetchedData.latin_name || formData.latin_name || '',
          group_name: fetchedData.group_name || formData.group_name || 'freshwater',
          min_length: fetchedData.min_length || formData.min_length || 10,
          max_length: fetchedData.max_length || formData.max_length || 100,
          max_weight: fetchedData.max_weight || formData.max_weight || 10,
          description_pl: fetchedData.description_pl || formData.description_pl || '',
          description_en: fetchedData.description_en || formData.description_en || '',
          description_de: fetchedData.description_de || formData.description_de || '',
          habitat_pl: fetchedData.habitat_pl || formData.habitat_pl || '',
          habitat_en: fetchedData.habitat_en || formData.habitat_en || '',
          habitat_de: fetchedData.habitat_de || formData.habitat_de || '',
          feeding_pl: fetchedData.feeding_pl || formData.feeding_pl || '',
          feeding_en: fetchedData.feeding_en || formData.feeding_en || '',
          feeding_de: fetchedData.feeding_de || '',
          spawning_pl: fetchedData.spawning_pl || formData.spawning_pl || '',
          spawning_en: fetchedData.spawning_en || formData.spawning_en || '',
          spawning_de: fetchedData.spawning_de || formData.spawning_de || '',
          image_url: fetchedData.image_url || formData.image_url || '',
          thumbnail_url: fetchedData.thumbnail_url || formData.thumbnail_url || '',
          legal_size: fetchedData.legal_size || formData.legal_size || 0,
          protected_period_start: fetchedData.protected_period_start || formData.protected_period_start || undefined,
          protected_period_end: fetchedData.protected_period_end || formData.protected_period_end || undefined
        });

        setFetchSuccess(true);
      } else {
        throw new Error('No data returned from URL');
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch data from URL');
    } finally {
      setIsFetching(false);
    }
  };

  const startEdit = (sp: FishSpecies) => {
    setFormData(sp);
    setEditingId(sp.id);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setFormData({});
    setEditingId(null);
    setIsCreating(false);
    setInputMode('manual');
    setImportUrl('');
    setFetchSuccess(false);
  };

  const saveSpecies = async () => {
    try {
      setError(null);

      if (!formData.code || !formData.name_en || !formData.name_pl) {
        setError('Code, English name, and Polish name are required');
        return;
      }

      const dataToSave = {
        ...formData,
        protected_period_start: formData.protected_period_start || null,
        protected_period_end: formData.protected_period_end || null,
      };

      if (isCreating) {
        const { error } = await supabase
          .from('fish_species')
          .insert([dataToSave]);

        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('fish_species')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
      }

      await loadSpecies();
      cancelEdit();
    } catch (err: any) {
      console.error('Failed to save species:', err);
      setError(err.message || 'Failed to save species');
    }
  };

  const deleteSpecies = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('fish_species')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSpecies();
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete species:', err);
      setError(err.message || 'Failed to delete species');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fish species...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Fish className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Fish Species Management</h1>
          </div>
          <button
            onClick={startCreate}
            disabled={isCreating || editingId !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Species
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {(isCreating || editingId) && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {isCreating ? 'Create New Species' : 'Edit Species'}
              </h2>
              {isCreating && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputMode('manual')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      inputMode === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setInputMode('import')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      inputMode === 'import'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Import from URL
                  </button>
                </div>
              )}
            </div>

            {inputMode === 'import' && isCreating && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL (RTW, Wikipedia, or other fish database)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.rtw.org.pl/atlas/szczupak.html"
                  />
                  <button
                    onClick={fetchDataFromUrl}
                    disabled={isFetching || !importUrl.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isFetching ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Fetch Data
                      </>
                    )}
                  </button>
                </div>
                {fetchSuccess && (
                  <p className="mt-2 text-sm text-green-600">
                    Data fetched successfully! Review and edit fields below before saving.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code (unique)
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., pike, perch, carp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latin Name
                </label>
                <input
                  type="text"
                  value={formData.latin_name || ''}
                  onChange={(e) => setFormData({ ...formData, latin_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  English Name
                </label>
                <input
                  type="text"
                  value={formData.name_en || ''}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Polish Name
                </label>
                <input
                  type="text"
                  value={formData.name_pl || ''}
                  onChange={(e) => setFormData({ ...formData, name_pl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  German Name
                </label>
                <input
                  type="text"
                  value={formData.name_de || ''}
                  onChange={(e) => setFormData({ ...formData, name_de: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group
                </label>
                <select
                  value={formData.group_name || 'freshwater'}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="freshwater">Freshwater</option>
                  <option value="saltwater">Saltwater</option>
                  <option value="predator">Predator</option>
                  <option value="bottom">Bottom Feeder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Length (cm)
                </label>
                <input
                  type="number"
                  value={formData.min_length || 0}
                  onChange={(e) => setFormData({ ...formData, min_length: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Length (cm)
                </label>
                <input
                  type="number"
                  value={formData.max_length || 0}
                  onChange={(e) => setFormData({ ...formData, max_length: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.max_weight || 0}
                  onChange={(e) => setFormData({ ...formData, max_weight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Size (cm)
                </label>
                <input
                  type="number"
                  value={formData.legal_size || 0}
                  onChange={(e) => setFormData({ ...formData, legal_size: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protection Start (YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  value={formData.protected_period_start || ''}
                  onChange={(e) => setFormData({ ...formData, protected_period_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2024-01-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protection End (YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  value={formData.protected_period_end || ''}
                  onChange={(e) => setFormData({ ...formData, protected_period_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2024-04-30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fish Image
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={isUploadingImage}
                      className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {isUploadingImage && (
                      <div className="flex items-center text-blue-600">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Uploading...
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Or enter image URL manually:
                  </div>
                  <input
                    type="text"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value, thumbnail_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/fish-image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2 space-y-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleImageDelete}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setLanguageTab('pl')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    languageTab === 'pl'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Polish
                </button>
                <button
                  onClick={() => setLanguageTab('en')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    languageTab === 'en'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguageTab('de')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    languageTab === 'de'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  German
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description ({languageTab.toUpperCase()})
                  </label>
                  <textarea
                    value={formData[`description_${languageTab}` as keyof FishSpecies] as string || ''}
                    onChange={(e) => setFormData({ ...formData, [`description_${languageTab}`]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Habitat ({languageTab.toUpperCase()})
                  </label>
                  <textarea
                    value={formData[`habitat_${languageTab}` as keyof FishSpecies] as string || ''}
                    onChange={(e) => setFormData({ ...formData, [`habitat_${languageTab}`]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feeding ({languageTab.toUpperCase()})
                  </label>
                  <textarea
                    value={formData[`feeding_${languageTab}` as keyof FishSpecies] as string || ''}
                    onChange={(e) => setFormData({ ...formData, [`feeding_${languageTab}`]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spawning ({languageTab.toUpperCase()})
                  </label>
                  <textarea
                    value={formData[`spawning_${languageTab}` as keyof FishSpecies] as string || ''}
                    onChange={(e) => setFormData({ ...formData, [`spawning_${languageTab}`]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={saveSpecies}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Icon</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Names</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Latin Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Size Range</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Max Weight</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {species.map((sp) => (
                  <tr key={sp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {sp.thumbnail_url ? (
                        <img
                          src={sp.thumbnail_url}
                          alt={sp.name_en}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{sp.code}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{sp.name_en}</div>
                      <div className="text-xs text-gray-500">{sp.name_pl} / {sp.name_de}</div>
                    </td>
                    <td className="px-4 py-3 text-sm italic text-gray-600">{sp.latin_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sp.min_length} - {sp.max_length} cm
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sp.max_weight} kg</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(sp)}
                          disabled={isCreating || editingId !== null}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(sp.id)}
                          disabled={isCreating || editingId !== null}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {species.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No fish species found. Add your first species to get started.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteSpecies(deleteConfirm)}
        title="Delete Fish Species"
        message="Are you sure you want to delete this fish species? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
}
