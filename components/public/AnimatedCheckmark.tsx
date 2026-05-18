'use client';

interface AnimatedCheckmarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export function AnimatedCheckmark({ size = 80, color = '#16A34A', className = '' }: AnimatedCheckmarkProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-checkmark-pop"
      >
        {/* Circle background */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="2"
          className="animate-checkmark-circle"
          strokeDasharray="226"
          strokeDashoffset="226"
          style={{
            animation: 'checkmark-circle 0.6s ease-out forwards',
          }}
        />
        {/* Checkmark */}
        <path
          d="M26 42L35 51L54 32"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            animation: 'checkmark-draw 0.4s ease-out 0.5s forwards',
            strokeDasharray: 40,
            strokeDashoffset: 40,
          }}
        />
      </svg>
      <style jsx>{`
        @keyframes checkmark-circle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes checkmark-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-checkmark-pop {
          animation: checkmark-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform: scale(0);
        }
        @keyframes checkmark-pop {
          to {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
