'use client';

import React, { useEffect, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export default function POSCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const fetchItems = () => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || []));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email }),
    });

    setName('');
    setPhone('');
    setEmail('');
    fetchItems();
  };

  return (
    <div className="grid grid-cols-3 gap-8 p-8 max-w-5xl">
      {/* Customers List */}
      <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-lg">Customer Directory</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage cafe loyalty profiles</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Name</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Contact</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{c.name}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-500">{c.phone || '-'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-500">{c.email || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">New Customer Profile</h3>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Customer Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Phone number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
          >
            Add Profile
          </button>
        </form>
      </div>
    </div>
  );
}
