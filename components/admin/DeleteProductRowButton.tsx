'use client';

import { Trash2 } from 'lucide-react';
import { deleteProductRow } from '@/lib/actions/productRows';

interface DeleteProductRowButtonProps {
  id: string;
  label?: string;
}

export function DeleteProductRowButton({ id, label }: DeleteProductRowButtonProps) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (confirm('Supprimer cette section ? Les produits associés seront déplacés vers les meilleures ventes.')) {
          await deleteProductRow(id);
          window.location.reload();
        }
      }}
      className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {label || 'Supprimer'}
    </button>
  );
}
