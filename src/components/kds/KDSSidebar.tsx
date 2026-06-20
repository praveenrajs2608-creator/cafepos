'use client';

import React from 'react';

interface FilterItem {
  id: string;
  name: string;
}

interface KDSSidebarProps {
  open: boolean;
  products: FilterItem[];
  categories: FilterItem[];
  selectedProducts: string[];
  selectedCategories: string[];
  onToggleProduct: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onClearFilters: () => void;
}

function FilterCheckbox({
  item,
  selected,
  onToggle,
}: {
  item: FilterItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(item.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all
        ${selected ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
    >
      <div className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition
        ${selected ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
        {selected && <span className="text-white text-[9px] font-black">✓</span>}
      </div>
      <span className="text-xs font-semibold truncate">{item.name}</span>
    </button>
  );
}

export default function KDSSidebar({
  open,
  products,
  categories,
  selectedProducts,
  selectedCategories,
  onToggleProduct,
  onToggleCategory,
  onClearFilters,
}: KDSSidebarProps) {
  const hasFilters = selectedProducts.length > 0 || selectedCategories.length > 0;

  return (
    <aside
      className={`flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${open ? 'w-52' : 'w-0'}`}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-w-[208px]">
        {/* Clear filter */}
        <div>
          <button
            onClick={onClearFilters}
            disabled={!hasFilters}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition
              ${hasFilters
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Clear Filters
            {hasFilters && (
              <span className="ml-auto bg-rose-500 text-white text-[9px] rounded-full px-1.5 py-0.5">
                {selectedProducts.length + selectedCategories.length}
              </span>
            )}
          </button>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 mb-1.5">Category</p>
            <div className="space-y-0.5">
              {categories.map((cat) => (
                <FilterCheckbox
                  key={cat.id}
                  item={cat}
                  selected={selectedCategories.includes(cat.id)}
                  onToggle={onToggleCategory}
                />
              ))}
            </div>
          </div>
        )}

        {/* Product filter */}
        {products.length > 0 && (
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 mb-1.5">Product</p>
            <div className="space-y-0.5">
              {products.map((prod) => (
                <FilterCheckbox
                  key={prod.id}
                  item={prod}
                  selected={selectedProducts.includes(prod.id)}
                  onToggle={onToggleProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
