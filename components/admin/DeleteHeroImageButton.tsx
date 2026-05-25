'use client';

import { Trash2 } from 'lucide-react';
import { deleteHeroImage } from '@/lib/actions/heroImages';

interface DeleteHeroImageButtonProps {
  id: string;
  label?: string;
}

export function DeleteHeroImageButton({ id, label }: DeleteHeroImageButtonProps) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (confirm('Supprimer cette image ?')) {
          await deleteHeroImage(id);
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
