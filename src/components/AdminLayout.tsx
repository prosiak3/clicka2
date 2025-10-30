import React, { useState } from 'react';
import { LayoutDashboard, Users, LogOut, Menu, X, Shield, Map, Cloud } from 'lucide-react';
import { User } from '../types';
import { signOut } from '../utils/auth';

interface AdminLayoutProps {
  user: User;
  children: React.ReactNode;
  currentView: 'dashboard' | 'users' | 'roadmap' | 'weather-api';
  onViewChange: (view: 'dashboard' | 'users' | 'roadmap' | 'weather-api') => void;
  onLogout: () => void;
}

export function AdminLayout({ user, children, currentView, onViewChange, onLogout }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await signOut();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const navigation = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      name: 'Users',
      icon: Users,
    },
    {
      id: 'roadmap',
      name: 'Roadmap',
      icon: Map,
    },
    {
      id: 'weather-api',
      name: 'Weather API',
      icon: Cloud,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="lg:flex lg:h-screen">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clicka</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Better Fishing</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as 'dashboard' | 'users' | 'roadmap' | 'weather-api')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </aside>

        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id as 'dashboard' | 'users' | 'roadmap' | 'weather-api');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          )}
        </div>

        <main className="flex-1 lg:ml-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
