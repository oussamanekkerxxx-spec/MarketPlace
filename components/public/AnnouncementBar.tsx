'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AnnouncementBarProps {
  text?: string;
  phone?: string;
}

export function AnnouncementBar({ text, phone }: AnnouncementBarProps) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const isDismissed = sessionStorage.getItem('announcement_dismissed');
      if (isDismissed === 'true') {
        setDismissed(true);
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('announcement_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // Don't render until client has mounted and checked sessionStorage.
  // This prevents both SSR hydration mismatch and the flash-before-hide.
  if (!mounted || !text || dismissed) return null;

  return (
    <div className="bg-secondary text-white text-center text-sm py-2.5 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="font-medium tracking-wide">{text}</span>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="text-accent font-semibold hover:underline"
          >
            {phone}
          </a>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
