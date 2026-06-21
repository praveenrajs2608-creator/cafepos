'use client';

import React, { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchItems = () =>
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setCustomers(d.users?.filter((u: User) => u.role === 'CUSTOMER') || []));

  useEffect(() => { fetchItems(); }, []);

  const startEdit = (u: User) => {
    setEditTarget(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setFormError('');
  };

  const cancelEdit = () => {
    setEditTarget(null);
    setName(''); setEmail(''); setPassword('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!editTarget && !password)) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      if (editTarget) {
        // Edit existing customer
        const body: any = { name, email, role: 'CUSTOMER' };
        if (password) body.password = password;
        const res = await fetch(`/api/users/${editTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error || 'Update failed'); return; }
      } else {
        // Create new customer
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: 'CUSTOMER' }),
        });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error || 'Create failed'); return; }
      }

      cancelEdit();
      fetchItems();
    } catch {
      setFormError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete customer "${u.name}"? This cannot be undone.`)) return;
    await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Customers table */}
      <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-lg">Customer Directory</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer accounts and loyalty profiles</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{c.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{c.email}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => startEdit(c)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 transition">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-sm">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Form */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-800 text-lg">
            {editTarget ? `Edit: ${editTarget.name}` : 'New Customer Account'}
          </h3>
          {editTarget && (
            <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-700 font-bold transition">
              Cancel
            </button>
          )}
        </div>

        {formError && (
          <p className="text-xs text-red-500 font-bold bg-red-50 border border-red-200 rounded-xl p-2">{formError}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Password {editTarget && <span className="text-slate-300">(leave blank to keep)</span>}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              required={!editTarget} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
