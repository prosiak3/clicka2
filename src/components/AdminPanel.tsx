import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/db';
import { Shield, Trash2, UserCog, Mail, Calendar, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  provider: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface AdminPanelProps {
  currentUserId: string;
}

export function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<{ userId: string; newRole: 'user' | 'admin' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'user' | 'admin') {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setRoleChangeConfirm(null);
    } catch (err) {
      console.error('Error changing role:', err);
      setError('Failed to change user role');
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      setUsers(users.filter(u => u.id !== userId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. You may need service role permissions.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-red-500" />
        <div>
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage users and permissions
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {user.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => setRoleChangeConfirm({ userId: user.id, newRole: e.target.value as 'user' | 'admin' })}
                      disabled={user.id === currentUserId}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      disabled={user.id === currentUserId}
                      className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={user.id === currentUserId ? "Cannot delete yourself" : "Delete user"}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete User"
          message="Are you sure you want to delete this user? This will permanently delete all their data including fishing sessions, catches, and settings. This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDeleteUser(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {roleChangeConfirm && (
        <ConfirmDialog
          title="Change User Role"
          message={`Are you sure you want to change this user's role to ${roleChangeConfirm.newRole}?`}
          confirmText="Change Role"
          onConfirm={() => handleRoleChange(roleChangeConfirm.userId, roleChangeConfirm.newRole)}
          onCancel={() => setRoleChangeConfirm(null)}
        />
      )}
    </div>
  );
}
