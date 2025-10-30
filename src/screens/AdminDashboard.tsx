import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/db';
import { Users, Activity, Fish, Calendar, TrendingUp, Database } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalCatches: number;
  activeToday: number;
  newUsersThisWeek: number;
  sessionsThisWeek: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalCatches: 0,
    activeToday: 0,
    newUsersThisWeek: 0,
    sessionsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [usersResult, sessionsResult, catchesResult, newUsersResult, recentSessionsResult] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('fishing_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('fish_catches').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('fishing_sessions').select('id', { count: 'exact', head: true }).gte('start_time', weekAgo),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalSessions: sessionsResult.count || 0,
        totalCatches: catchesResult.count || 0,
        activeToday: 0,
        newUsersThisWeek: newUsersResult.count || 0,
        sessionsThisWeek: recentSessionsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: Activity,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Catches',
      value: stats.totalCatches,
      icon: Fish,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'New Users (7d)',
      value: stats.newUsersThisWeek,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Sessions (7d)',
      value: stats.sessionsThisWeek,
      icon: Calendar,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Database Status',
      value: 'Online',
      icon: Database,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      isText: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          System overview and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.color} rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
              <p className={`text-3xl font-bold ${card.textColor} dark:${card.textColor.replace('text-', 'text-')}`}>
                {card.isText ? card.value : card.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all users</p>
          </button>
          <button className="p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Activity className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">View Sessions</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monitor fishing sessions</p>
          </button>
        </div>
      </div>
    </div>
  );
}
