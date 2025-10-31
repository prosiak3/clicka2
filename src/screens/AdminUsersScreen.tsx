import React from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { User } from '../types';

interface AdminUsersScreenProps {
  user: User;
}

export function AdminUsersScreen({ user }: AdminUsersScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <AdminPanel currentUserId={user.id} />
    </div>
  );
}
