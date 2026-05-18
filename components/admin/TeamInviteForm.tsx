'use client';

import { useState } from 'react';
import { inviteUser } from '@/lib/actions/team';

export function TeamInviteForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager'>('manager');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const result = await inviteUser(email, role);
    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Invitation envoyée');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'success' && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {status === 'error' && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          placeholder="colleague@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? 'Envoi...' : 'Inviter'}
      </button>
    </form>
  );
}
