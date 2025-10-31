import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/db';
import { Plus, Edit2, Trash2, Save, X, CheckCircle2, Clock, Circle } from 'lucide-react';
import { User } from '../types';

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  phase: number;
  priority: number;
}

interface AppVersion {
  id: string;
  version: string;
  release_date: string;
  is_current: boolean;
}

interface ChangelogEntry {
  id: string;
  version_id: string;
  type: 'added' | 'changed' | 'fixed' | 'removed';
  description: string;
}

interface AdminRoadmapScreenProps {
  user: User;
}

export function AdminRoadmapScreen({ user }: AdminRoadmapScreenProps) {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'changelog'>('roadmap');
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [roadmapResult, versionsResult, changelogResult] = await Promise.all([
        supabase.from('roadmap_items').select('*').order('phase').order('priority'),
        supabase.from('app_versions').select('*').order('release_date', { ascending: false }),
        supabase.from('changelog_entries').select('*').order('created_at', { ascending: false })
      ]);

      if (roadmapResult.data) setRoadmapItems(roadmapResult.data);
      if (versionsResult.data) setVersions(versionsResult.data);
      if (changelogResult.data) setChangelogEntries(changelogResult.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveRoadmapItem(item: Partial<RoadmapItem>) {
    try {
      if (item.id) {
        await supabase.from('roadmap_items').update(item).eq('id', item.id);
      } else {
        await supabase.from('roadmap_items').insert([item]);
      }
      await loadData();
      setEditingItem(null);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error saving roadmap item:', err);
    }
  }

  async function deleteRoadmapItem(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await supabase.from('roadmap_items').delete().eq('id', id);
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  }

  async function saveVersion(version: Partial<AppVersion>) {
    try {
      if (version.id) {
        await supabase.from('app_versions').update(version).eq('id', version.id);
      } else {
        await supabase.from('app_versions').insert([version]);
      }
      await loadData();
      setEditingVersion(null);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error saving version:', err);
    }
  }

  async function deleteVersion(id: string) {
    if (!confirm('Are you sure? This will delete all related changelog entries.')) return;
    try {
      await supabase.from('app_versions').delete().eq('id', id);
      await loadData();
    } catch (err) {
      console.error('Error deleting version:', err);
    }
  }

  async function saveChangelogEntry(entry: Partial<ChangelogEntry>) {
    try {
      if (entry.id) {
        await supabase.from('changelog_entries').update(entry).eq('id', entry.id);
      } else {
        await supabase.from('changelog_entries').insert([entry]);
      }
      await loadData();
      setEditingEntry(null);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error saving changelog entry:', err);
    }
  }

  async function deleteChangelogEntry(id: string) {
    if (!confirm('Are you sure you want to delete this changelog entry?')) return;
    try {
      await supabase.from('changelog_entries').delete().eq('id', id);
      await loadData();
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  }

  const groupedByPhase = roadmapItems.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<number, RoadmapItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roadmap Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage the product roadmap and changelog
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'roadmap'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Roadmap Items
        </button>
        <button
          onClick={() => setActiveTab('changelog')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'changelog'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Changelog
        </button>
      </div>

      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setEditingItem({ id: '', title: '', description: '', status: 'planned', phase: 1, priority: 0 });
              setIsAddingNew(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Roadmap Item
          </button>

          {isAddingNew && editingItem && (
            <RoadmapItemForm
              item={editingItem}
              onSave={saveRoadmapItem}
              onCancel={() => {
                setEditingItem(null);
                setIsAddingNew(false);
              }}
            />
          )}

          {Object.entries(groupedByPhase).map(([phase, items]) => (
            <div key={phase}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Phase {phase}</h2>
              <div className="space-y-3">
                {items.map((item) =>
                  editingItem?.id === item.id ? (
                    <RoadmapItemForm
                      key={item.id}
                      item={editingItem}
                      onSave={saveRoadmapItem}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {item.status === 'in_progress' && <Clock className="w-5 h-5 text-blue-500" />}
                            {item.status === 'planned' && <Circle className="w-5 h-5 text-gray-400" />}
                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {item.status}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              Priority: {item.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRoadmapItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'changelog' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingVersion({ id: '', version: '', release_date: new Date().toISOString(), is_current: false });
                setIsAddingNew(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Version
            </button>
            <button
              onClick={() => {
                if (versions.length === 0) {
                  alert('Please add a version first');
                  return;
                }
                setEditingEntry({ id: '', version_id: versions[0].id, type: 'added', description: '' });
                setIsAddingNew(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              Add Changelog Entry
            </button>
          </div>

          {isAddingNew && editingVersion && (
            <VersionForm
              version={editingVersion}
              onSave={saveVersion}
              onCancel={() => {
                setEditingVersion(null);
                setIsAddingNew(false);
              }}
            />
          )}

          {isAddingNew && editingEntry && (
            <ChangelogEntryForm
              entry={editingEntry}
              versions={versions}
              onSave={saveChangelogEntry}
              onCancel={() => {
                setEditingEntry(null);
                setIsAddingNew(false);
              }}
            />
          )}

          {versions.map((version) => (
            <div key={version.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              {editingVersion?.id === version.id ? (
                <VersionForm
                  version={editingVersion}
                  onSave={saveVersion}
                  onCancel={() => setEditingVersion(null)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">v{version.version}</h3>
                      {version.is_current && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                          Current
                        </span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(version.release_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingVersion(version)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteVersion(version.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {changelogEntries
                      .filter((entry) => entry.version_id === version.id)
                      .map((entry) =>
                        editingEntry?.id === entry.id ? (
                          <ChangelogEntryForm
                            key={entry.id}
                            entry={editingEntry}
                            versions={versions}
                            onSave={saveChangelogEntry}
                            onCancel={() => setEditingEntry(null)}
                          />
                        ) : (
                          <div key={entry.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-start gap-3 flex-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded uppercase ${getTypeColor(entry.type)}`}>
                                {entry.type}
                              </span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{entry.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingEntry(entry)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteChangelogEntry(entry.id)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: RoadmapItem;
  onSave: (item: Partial<RoadmapItem>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(item);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-500">
      <div className="space-y-3">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Title"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div className="grid grid-cols-3 gap-3">
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="number"
            value={formData.phase}
            onChange={(e) => setFormData({ ...formData, phase: parseInt(e.target.value) })}
            placeholder="Phase"
            min="1"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            placeholder="Priority"
            min="0"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function VersionForm({
  version,
  onSave,
  onCancel,
}: {
  version: AppVersion;
  onSave: (version: Partial<AppVersion>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(version);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-500">
      <div className="space-y-3">
        <input
          type="text"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          placeholder="Version (e.g., 0.2.0)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <input
          type="date"
          value={formData.release_date.split('T')[0]}
          onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <label className="flex items-center gap-2 text-gray-900 dark:text-white">
          <input
            type="checkbox"
            checked={formData.is_current}
            onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
            className="rounded"
          />
          Current version
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangelogEntryForm({
  entry,
  versions,
  onSave,
  onCancel,
}: {
  entry: ChangelogEntry;
  versions: AppVersion[];
  onSave: (entry: Partial<ChangelogEntry>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(entry);

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-500">
      <div className="space-y-3">
        <select
          value={formData.version_id}
          onChange={(e) => setFormData({ ...formData, version_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version}
            </option>
          ))}
        </select>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="added">Added</option>
          <option value="changed">Changed</option>
          <option value="fixed">Fixed</option>
          <option value="removed">Removed</option>
        </select>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function getTypeColor(type: string) {
  switch (type) {
    case 'added':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    case 'changed':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    case 'fixed':
      return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
    case 'removed':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
  }
}
