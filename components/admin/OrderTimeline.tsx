'use client';

const steps = [
  { key: 'pending', label: 'En attente', timestampKey: null as string | null },
  { key: 'confirmed', label: 'Confirmée', timestampKey: 'confirmed_at' },
  { key: 'shipped', label: 'Expédiée', timestampKey: 'shipped_at' },
  { key: 'delivered', label: 'Livrée', timestampKey: 'delivered_at' },
];

interface OrderTimelineProps {
  status: string;
  timestamps: {
    confirmed_at?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
    cancelled_at?: string | null;
    returned_at?: string | null;
  };
}

type StepState = 'completed' | 'current' | 'upcoming' | 'neutral';

export function OrderTimeline({ status, timestamps }: OrderTimelineProps) {
  const isTerminal = status === 'cancelled' || status === 'returned' || status === 'fake';
  const terminalLabel =
    status === 'cancelled' ? 'Annulée' : status === 'returned' ? 'Retournée' : 'Fausse';
  const terminalDate =
    status === 'cancelled'
      ? timestamps.cancelled_at
      : status === 'returned'
      ? timestamps.returned_at
      : null;

  const getStepState = (index: number): StepState => {
    const stepIndex = steps.findIndex((s) => s.key === status);
    if (isTerminal) return 'neutral';
    if (index < stepIndex) return 'completed';
    if (index === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      {/* ─── Mobile (vertical stack) ──────────────────────────────────── */}
      <ol className="lg:hidden space-y-0">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const timestamp = step.timestampKey
            ? (timestamps as Record<string, string | null | undefined>)[step.timestampKey]
            : null;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
              {/* Vertical connector to the next step */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                    state === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Dot */}
              <div
                className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  state === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : state === 'current'
                    ? 'bg-white border-orange-500 text-orange-600 ring-4 ring-orange-100'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {state === 'completed' ? '✓' : index + 1}
              </div>

              {/* Label + timestamp */}
              <div className="flex-1 min-w-0 pt-1.5">
                <p
                  className={`text-sm font-semibold ${
                    state === 'current'
                      ? 'text-orange-600'
                      : state === 'completed'
                      ? 'text-green-700'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(timestamp).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ─── Desktop (horizontal — original design) ─────────────────────── */}
      <div className="hidden lg:flex items-center justify-between">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const timestamp = step.timestampKey
            ? (timestamps as Record<string, string | null | undefined>)[step.timestampKey]
            : null;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {index > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 ${
                    state === 'completed' || state === 'current'
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}

              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  state === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : state === 'current'
                    ? 'bg-white border-orange-500 text-orange-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {state === 'completed' ? '✓' : index + 1}
              </div>

              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-medium ${
                    state === 'current'
                      ? 'text-orange-600'
                      : state === 'completed'
                      ? 'text-green-700'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-[10px] text-gray-500">
                    {new Date(timestamp).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal status banner */}
      {isTerminal && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center text-sm">
          <span className="font-semibold">{terminalLabel}</span>
          {terminalDate && (
            <span className="text-gray-500 ml-2">
              le {new Date(terminalDate).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
