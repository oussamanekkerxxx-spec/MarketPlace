'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { anonymizeOrder } from '@/lib/actions/orders';
import { Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function AnonymizeOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAnonymize = () => {
    startTransition(async () => {
      const result = await anonymizeOrder(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Donnees client anonymisees');
        setShowConfirm(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Anonymiser les donnees client
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirmer l&apos;anonymisation</h3>
            </div>
            <p className="mb-6 text-gray-600">
              Cette action supprimera le nom, le telephone et l&apos;adresse du client.
              L&apos;historique de commande sera conserve avec les donnees anonymisees.
              Cette action est irreversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                onClick={handleAnonymize}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? '...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
