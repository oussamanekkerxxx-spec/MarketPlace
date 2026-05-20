'use client';

import { Trash2 } from 'lucide-react';
import { deleteWhyUsItem } from '@/lib/actions/whyUsItems';

interface DeleteWhyUsButtonProps {
  id: string;
  label?: string;
}

export function DeleteWhyUsButton({ id, label }: DeleteWhyUsButtonProps) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (confirm('Supprimer cet élément ?')) {
          await deleteWhyUsItem(id);
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
