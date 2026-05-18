import { cn } from '@/lib/utils/cn';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Expédiée', className: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Livrée', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
  no_answer: { label: 'Pas de réponse', className: 'bg-gray-100 text-gray-800' },
  fake: { label: 'Fausse', className: 'bg-red-50 text-red-600' },
  returned: { label: 'Retournée', className: 'bg-orange-100 text-orange-800' },
  active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-800' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {customLabel || config.label}
    </span>
  );
}
