'use client';

import { useState, useEffect } from 'react';

interface AttributeEditorProps {
  initialAttributes: Record<string, string>;
  onChange: (attributes: Record<string, string>) => void;
}

export function AttributeEditor({ initialAttributes, onChange }: AttributeEditorProps) {
  const [rows, setRows] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    const entries = Object.entries(initialAttributes || {});
    setRows(entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]);
  }, [initialAttributes]);

  const updateRow = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...rows];
    next[index][field] = val;
    setRows(next);
    const attrs = Object.fromEntries(next.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]));
    onChange(attrs);
  };

  const addRow = () => {
    setRows([...rows, { key: '', value: '' }]);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    setRows(next.length > 0 ? next : [{ key: '', value: '' }]);
    const attrs = Object.fromEntries(next.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]));
    onChange(attrs);
  };

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={row.key}
            onChange={(e) => updateRow(i, 'key', e.target.value)}
            placeholder="Clé (ex: Matière)"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
            placeholder="Valeur (ex: Cuir véritable)"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-orange-600 font-medium hover:underline"
      >
        + Ajouter une caractéristique
      </button>
    </div>
  );
}
