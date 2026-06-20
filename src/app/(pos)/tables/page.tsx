'use client';

import React, { useEffect, useState } from 'react';

interface Table {
  id: string;
  name: string;
  token: string;
  floor: { name: string };
}

export default function POSTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [qrDetails, setQrDetails] = useState<Record<string, { qrUrl: string; pdfPath: string }>>({});

  useEffect(() => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || []);
        // Fetch QR details for each table
        data.tables?.forEach((table: Table) => {
          fetch(`/api/tables/${table.id}/qr`)
            .then((res) => res.json())
            .then((qrData) => {
              setQrDetails((prev) => ({ ...prev, [table.id]: qrData }));
            });
        });
      });
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Dine-in Tables layout</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage customer-ordering QR links and dining slots</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{table.floor.name}</span>
              <h3 className="font-extrabold text-slate-800 text-xl mt-1">{table.name}</h3>
            </div>
            
            {qrDetails[table.id] && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <a
                  href={qrDetails[table.id].qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-center py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded-xl transition"
                >
                  Open Ordering Link
                </a>
                <span className="text-[10px] font-mono text-center text-slate-400">{table.token}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
