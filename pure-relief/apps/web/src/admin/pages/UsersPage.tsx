import { useState } from 'react';
import { Plus, UserX } from 'lucide-react';
import { useAdminUsers, useDeactivateAdminUser } from '@/admin/hooks/use-admin-data';
import { api, readCsrfCookie, ApiClientError } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@pure-relief/shared';

export function UsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const deactivate = useDeactivateAdminUser();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    setIsSaving(true);
    setError(null);
    try {
      const result = await api.post<{ temporaryPassword: string }>('/api/admin/users', { email, fullName, role }, readCsrfCookie());
      setTempPassword(result.temporaryPassword);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setEmail('');
      setFullName('');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to invite user.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-ink">Users</h1>
          <p className="mt-1 text-ink-soft">Manage admin accounts and permissions.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Invite User
        </button>
      </div>

      {showForm && (
        <div className="card-surface mt-6 space-y-4 p-6">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          {tempPassword && (
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              User created. Temporary password: <span className="font-mono font-bold">{tempPassword}</span> — share this securely; it won't be shown again.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input-field">
                <option value="editor">Editor</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <button onClick={handleInvite} disabled={isSaving || !email || !fullName} className="btn-primary text-sm">
            {isSaving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)
        ) : users && users.length > 0 ? (
          users.map((u) => (
            <div key={u.id} className="card-surface flex items-center justify-between p-5">
              <div>
                <p className="font-medium text-ink">{u.fullName}</p>
                <p className="text-sm text-ink-soft">{u.email} · <span className="capitalize">{u.role}</span></p>
              </div>
              <button onClick={() => { if (confirm(`Deactivate ${u.fullName}?`)) deactivate.mutate(u.id); }} className="text-red-500 hover:text-red-600" aria-label="Deactivate user">
                <UserX className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-ink-soft">No users yet.</p>
        )}
      </div>
    </div>
  );
}
