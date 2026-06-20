'use client';

import React, { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');

  const fetchItems = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    setName('');
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Categories table */}
      <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-lg">Menu Categories</h3>
          <p className="text-xs text-slate-400 mt-0.5">Define classifications of dishes</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Category Name</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">Total Products</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{cat.name}</td>
                <td className="px-6 py-4 font-bold text-slate-500 text-center">{cat._count?.products || 0} items</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm h-fit space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">New Category</h3>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
          >
            Add Category
          </button>
        </form>
      </div>
    </div>
  );
}
