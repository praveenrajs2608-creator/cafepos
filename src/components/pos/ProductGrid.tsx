'use client';

import React, { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryId: string;
  cuisineId: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Cuisine {
  id: string;
  name: string;
}

interface ProductGridProps {
  onAddToCart: (product: { id: string; name: string; price: number }) => void;
}

// Emoji badges for cuisines
const CUISINE_EMOJI: Record<string, string> = {
  American:    '🍔',
  Chinese:     '🥢',
  Indian:      '🍛',
  Italian:     '🍕',
  Mexican:     '🌮',
  Spanish:     '🥘',
  Continental: '🥗',
};

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [cuisines, setCuisines]         = useState<Cuisine[]>([]);
  const [selectedCuisineId, setSelectedCuisineId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId]         = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));

    fetch('/api/cuisines')
      .then(r => r.json())
      .then(d => setCuisines(d.cuisines || []));

    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []));
  }, []);

  // Filter out legacy "Continental" — only show cuisines from the SQL data
  const displayCuisines = cuisines.filter(c => c.name !== 'Continental');
  const handleCuisineChange = (id: string | null) => {
    setSelectedCuisineId(id);
    setSelectedCatId(null);
  };

  // Filter products by cuisine then category
  const byCuisine = selectedCuisineId
    ? products.filter(p => p.cuisineId === selectedCuisineId)
    : products;

  const filtered = selectedCatId
    ? byCuisine.filter(p => p.categoryId === selectedCatId)
    : byCuisine;

  // Only show categories that exist in the current cuisine filter
  const visibleCategoryIds = new Set(byCuisine.map(p => p.categoryId));
  const visibleCategories = categories.filter(c => visibleCategoryIds.has(c.id));

  return (
    <div className="flex flex-col gap-4 flex-1 h-full overflow-hidden">

      {/* ── Cuisine row ─────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => handleCuisineChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${
            selectedCuisineId === null
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🍽️ All Cuisines
        </button>

        {displayCuisines.map(cuisine => (
          <button
            key={cuisine.id}
            onClick={() => handleCuisineChange(cuisine.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
              selectedCuisineId === cuisine.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {CUISINE_EMOJI[cuisine.name] ?? '🍴'} {cuisine.name}
          </button>
        ))}
      </div>

      {/* ── Category sub-row ────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCatId(null)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
            selectedCatId === null
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Items
        </button>

        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCatId(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              selectedCatId === cat.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Products Grid ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <span className="text-4xl">🍽️</span>
            <p className="text-sm font-medium">No items in this selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(prod => (
              <button
                key={prod.id}
                onClick={() => onAddToCart(prod)}
                className="p-5 bg-white border border-slate-200 rounded-2xl text-left flex flex-col justify-between hover:border-purple-500 hover:shadow-lg transition-all duration-200 group active:scale-[0.98]"
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-purple-600 transition leading-snug">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {prod.description || 'No description available'}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-purple-600 font-extrabold text-lg">
                    ₹{prod.price.toFixed(2)}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-lg font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductGrid;
