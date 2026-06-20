'use client';

import React, { useEffect, useState } from 'react';

interface Table {
  id: string;
  name: string;
  token: string;
  floor: { name: string };
}

interface Floor {
  id: string;
  name: string;
}

export default function AdminFloorsTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [name, setName] = useState('');
  const [floorId, setFloorId] = useState('');

  const fetchItems = () => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((data) => setTables(data.tables || []));
  };

  useEffect(() => {
    fetchItems();
    fetch('/api/floors')
      .then((res) => res.json())
      .then((data) => {
        setFloors(data.floors || []);
        if (data.floors?.length > 0) setFloorId(data.floors[0].id);
      });
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !floorId) return;

    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, floorId }),
    });

    setName('');
    fetchItems();
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Table grid */}
      <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-lg">Tables Registry</h3>
          <p className="text-xs text-slate-400 mt-0.5">Dine-in layout and customer ordering QR keys</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Table Label</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Floor Section</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Self-order Token</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tables.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{t.name}</td>
                <td className="px-6 py-4 font-semibold text-slate-500">{t.floor.name}</td>
                <td className="px-6 py-4 text-xs font-mono text-purple-600 font-extrabold">{t.token}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">New Table Layout</h3>

        <form onSubmit={handleAddTable} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Table Name / Number</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Floor Section</label>
            <select
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
          >
            Create Table
          </button>
        </form>
      </div>
    </div>
  );
}
