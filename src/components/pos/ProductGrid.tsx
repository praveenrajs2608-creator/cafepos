'use client';

import React, { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductGridProps {
  onAddToCart: (product: { id: string; name: string; price: number }) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    // Fetch products
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  const filteredProducts = selectedCatId
    ? products.filter((p) => p.categoryId === selectedCatId)
    : products;

  return (
    <div className="flex flex-col gap-6 flex-1 h-full overflow-hidden">
      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCatId(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
            selectedCatId === null
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Items
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCatId(cat.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              selectedCatId === cat.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <button
              key={prod.id}
              onClick={() => onAddToCart(prod)}
              className="p-5 bg-white border border-slate-200 rounded-2xl text-left flex flex-col justify-between hover:border-purple-500 hover:shadow-lg transition-all duration-200 group active:scale-[0.98]"
            >
              <div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition">
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {prod.description || 'No description available'}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-purple-600 font-extrabold text-lg">
                  ${prod.price.toFixed(2)}
                </span>
                <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-lg font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                  +
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ProductGrid;
