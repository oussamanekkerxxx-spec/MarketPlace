'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/lib/actions/orders';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Livrée', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Annulée', color: 'bg-red-100 text-red-800' },
  { value: 'no_answer', label: 'Pas de réponse', color: 'bg-gray-100 text-gray-800' },
  { value: 'fake', label: 'Fausse', color: 'bg-red-50 text-red-600' },
  { value: 'returned', label: 'Retournée', color: 'bg-orange-100 text-orange-800' },
];

interface StatusSelectProps {
  orderId: string;
  currentStatus: string;
  size?: 'sm' | 'md';
}

export function StatusSelect({ orderId, currentStatus, size = 'sm' }: StatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const previousStatus = status;
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result?.error) {
        setStatus(previousStatus);
        toast.error(result.error);
      }
    });
  };

  const currentOption = statusOptions.find((s) => s.value === status);

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`rounded-full font-medium border-0 cursor-pointer outline-none focus:ring-2 focus:ring-orange-500 ${
        size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'
      } ${currentOption?.color || 'bg-gray-100 text-gray-800'}`}
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {isPending && status === option.value ? '...' : ''}{option.label}
        </option>
      ))}
    </select>
  );
}
