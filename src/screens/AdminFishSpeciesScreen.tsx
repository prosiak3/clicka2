import React, { useState, useEffect } from 'react';
import { Fish, Plus, Edit, Trash2, Save, X, Image, AlertCircle } from 'lucide-react';
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
  image_url?: string;
  thumbnail_url?: string;
  legal_size?: number;
  created_at: string;
  updated_at: string;
}

export function AdminFishSpeciesScreen() {
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FishSpecies>>({});

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
      image_url: '',
      thumbnail_url: '',
      legal_size: 0
    });
    setIsCreating(true);
    setEditingId(null);
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
  };

  const saveSpecies = async () => {
    try {
      setError(null);

      if (!formData.code || !formData.name_en || !formData.name_pl) {
        setError('Code, English name, and Polish name are required');
        return;
      }

      if (isCreating) {
        const { error } = await supabase
          .from('fish_species')
          .insert([formData]);

        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase
          .from('fish_species')
          .update(formData)
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
            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? 'Create New Species' : 'Edit Species'}
            </h2>

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/fish-image.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={formData.thumbnail_url || ''}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/fish-thumbnail.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Polish)
                </label>
                <textarea
                  value={formData.description_pl || ''}
                  onChange={(e) => setFormData({ ...formData, description_pl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
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
