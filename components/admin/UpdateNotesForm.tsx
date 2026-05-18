'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { updateOrderNotes } from '@/lib/actions/orders';
import toast from 'react-hot-toast';

interface UpdateNotesFormProps {
  orderId: string;
  initialNotes: string;
}

type SaveState = 'idle' | 'saving' | 'saved';

export function UpdateNotesForm({ orderId, initialNotes }: UpdateNotesFormProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [lastSavedNotes, setLastSavedNotes] = useState(initialNotes);
  const [status, setStatus] = useState<SaveState>('idle');
  const [, startTransition] = useTransition();
  const notesRef = useRef(initialNotes);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const saveNotes = useCallback((nextNotes: string) => {
    startTransition(async () => {
      const result = await updateOrderNotes(orderId, nextNotes);

      if (result?.error) {
        toast.error(result.error);
        setStatus('idle');
        return;
      }

      setLastSavedNotes(nextNotes);
      setStatus(notesRef.current === nextNotes ? 'saved' : 'saving');
      window.setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 1800);
    });
  }, [orderId, startTransition]);

  useEffect(() => {
    if (notes === lastSavedNotes) return;

    timeoutRef.current = window.setTimeout(() => {
      saveNotes(notes);
    }, 900);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [lastSavedNotes, notes, saveNotes]);

  const handleBlur = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (notes !== lastSavedNotes) {
      saveNotes(notes);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => {
          const nextValue = e.target.value;
          setNotes(nextValue);
          if (nextValue !== lastSavedNotes) {
            setStatus('saving');
          }
        }}
        onBlur={handleBlur}
        placeholder="Ajouter des notes sur cette commande..."
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-y min-h-[100px]"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Les notes se sauvegardent automatiquement pendant la saisie et quand vous quittez le champ
        </p>
        {status === 'saving' && <span className="text-xs text-amber-600">Enregistrement...</span>}
        {status === 'saved' && <span className="text-xs text-green-600">Enregistre</span>}
      </div>
    </div>
  );
}
