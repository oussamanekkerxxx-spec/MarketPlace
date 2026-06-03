'use client';

import { Trash2 } from 'lucide-react';
import { deleteProduct } from '@/lib/actions/products';

interface DeleteProductButtonProps {
  id: string;
  label?: string;
}

export function DeleteProductButton({ id, label }: DeleteProductButtonProps) {
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Supprimer ce produit ?')) {
          const result = await deleteProduct(id);
          if (result && 'error' in result && result.error) {
            alert(result.error);
          } else {
            window.location.reload();
          }
        }
      }}
      className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {label || 'Supprimer'}
    </button>
  );
}
