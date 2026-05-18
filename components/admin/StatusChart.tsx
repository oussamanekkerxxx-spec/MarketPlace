'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusItem {
  name: string;
  value: number;
  color: string;
}

export function StatusChart({ data }: { data: StatusItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Répartition des commandes</h3>
      <div className="h-64 w-full">
        {!mounted ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />
        ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => [
                `${value} (${total > 0 ? ((Number(value) / total) * 100).toFixed(0) : 0}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.name}</span>
            <span className="text-gray-900 font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
