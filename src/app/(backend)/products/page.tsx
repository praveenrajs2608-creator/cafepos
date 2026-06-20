'use client';

import React, { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryId: string;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');

  const fetchItems = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []));
  };

  useEffect(() => {
    fetchItems();
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        if (data.categories?.length > 0) setCatId(data.categories[0].id);
      });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !catId) return;

    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, description: desc, categoryId: catId }),
    });

    setName('');
    setPrice('');
    setDesc('');
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Product List */}
      <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-lg">Menu Registry</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage all hot dishes, desserts and beverages</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Item Name</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Unit Price</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-500">{item.category.name}</td>
                <td className="px-6 py-4 font-extrabold text-purple-600">${item.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
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
        <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">New Dish Registration</h3>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unit Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Category Category</label>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Short Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
          >
            Create Product
          </button>
        </form>
      </div>
    </div>
  );
}
