import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/db';
import { ArrowLeft, Map, CheckCircle2, Clock, Circle, Plus, Edit2, Trash2, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  phase: number;
  priority: number;
  created_at: string;
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
  created_at: string;
}

interface VersionWithChangelog extends AppVersion {
  entries: ChangelogEntry[];
}

export function RoadmapScreen() {
  const navigate = useNavigate();
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [versions, setVersions] = useState<VersionWithChangelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'changelog'>('roadmap');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [roadmapResult, versionsResult, changelogResult] = await Promise.all([
        supabase
          .from('roadmap_items')
          .select('*')
          .order('phase', { ascending: true })
          .order('priority', { ascending: true }),
        supabase
          .from('app_versions')
          .select('*')
          .order('release_date', { ascending: false }),
        supabase
          .from('changelog_entries')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (roadmapResult.data) setRoadmapItems(roadmapResult.data);

      if (versionsResult.data && changelogResult.data) {
        const versionsWithChangelog = versionsResult.data.map(version => ({
          ...version,
          entries: changelogResult.data.filter(entry => entry.version_id === version.id)
        }));
        setVersions(versionsWithChangelog);
      }
    } catch (err) {
      console.error('Error loading roadmap data:', err);
    } finally {
      setLoading(false);
    }
  }

  const groupedByPhase = roadmapItems.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<number, RoadmapItem[]>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Planned';
    }
  };

  const getTypeColor = (type: string) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Map className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ClickA Better Fishing
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track our progress and see what's coming next
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'roadmap'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'changelog'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Changelog
          </button>
        </div>

        {activeTab === 'roadmap' ? (
          <div className="space-y-8">
            {Object.entries(groupedByPhase).map(([phase, items]) => (
              <div key={phase}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Phase {phase}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {versions.map((version) => (
              <div
                key={version.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    v{version.version}
                  </h2>
                  {version.is_current && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                      Current
                    </span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                    {new Date(version.release_date).toLocaleDateString()}
                  </span>
                </div>

                {version.entries.length > 0 ? (
                  <div className="space-y-2">
                    {version.entries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded uppercase ${getTypeColor(
                            entry.type
                          )}`}
                        >
                          {entry.type}
                        </span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {entry.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No changes recorded for this version
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
