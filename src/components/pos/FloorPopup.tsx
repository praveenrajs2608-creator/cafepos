'use client';

import React, { useEffect, useState } from 'react';

interface Table {
  id: string;
  name: string;
  floorId: string;
}

interface Floor {
  id: string;
  name: string;
  tables: Table[];
}

interface FloorPopupProps {
  onSelectTable: (table: Table | null) => void;
  onClose: () => void;
}

export function FloorPopup({ onSelectTable, onClose }: FloorPopupProps) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

  useEffect(() => {
    fetch('/api/floors')
      .then((res) => res.json())
      .then((data) => {
        setFloors(data.floors || []);
        if (data.floors && data.floors.length > 0) {
          setSelectedFloor(data.floors[0]);
        }
      });
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Select Floor & Table</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">✕</button>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor)}
              className={`px-6 py-3 font-semibold text-sm transition-all duration-200 ${
                selectedFloor?.id === floor.id
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => {
                onSelectTable(null);
                onClose();
              }}
              className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-purple-500 hover:text-purple-600 transition duration-200"
            >
              <span className="font-bold text-base">Take Away</span>
              <span className="text-xs mt-1">No Table</span>
            </button>

            {selectedFloor?.tables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  onSelectTable(table);
                  onClose();
                }}
                className="p-6 border border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center hover:border-purple-600 hover:shadow-md transition duration-200"
              >
                <span className="font-bold text-lg text-slate-700">{table.name}</span>
                <span className="text-xs text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded-full">Available</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default FloorPopup;
