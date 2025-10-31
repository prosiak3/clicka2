import React, { useState } from 'react';
import { Key, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function AdminPasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('https://czopkukjtdwpesebelcp.supabase.co/functions/v1/admin-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage({ type: 'success', text: `Password updated successfully for ${email}` });
      setEmail('');
      setNewPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reset password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-gray-900">Admin: Reset Password</h3>
      </div>

      {message && (
        <div className={`mb-3 p-3 rounded-lg flex items-start gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-3">
        <div>
          <label htmlFor="admin-email" className="block text-xs font-medium text-gray-700 mb-1">
            User Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="user@example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="block text-xs font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="admin-password"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="min. 6 characters"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Reset Password
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3">
        This is a development tool. Remove in production.
      </p>
    </div>
  );
}
