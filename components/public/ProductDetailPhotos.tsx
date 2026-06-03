'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

interface ProductDetailPhotosProps {
  images: string[];
  alt: string;
}

export function ProductDetailPhotos({ images: rawImages, alt }: ProductDetailPhotosProps) {
  const t = useTranslations('product');
  const images = (rawImages || []).filter(Boolean);
  const [expanded, setExpanded] = useState(false);

  if (images.length === 0) return null;

  const first = images[0];
  const second = images[1];
  const rest = images.slice(2);
  const hasMore = images.length > 1;
  const remainingCount = images.length - 1;

  return (
    <div className="flex flex-col items-center gap-3 mb-2">
      {/* First image — always fully visible */}
      <div className="w-[95%] rounded-xl overflow-hidden">
        <img
          src={first}
          alt={`${alt} - détail 1`}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Second image — peeked when collapsed, full when expanded */}
      {hasMore && second && (
        <div className="w-[95%] relative">
          <div
            className={`rounded-xl overflow-hidden relative ${
              expanded ? '' : 'max-h-[42vw]'
            }`}
          >
            <img
              src={second}
              alt={`${alt} - détail 2`}
              className="w-full h-auto"
              loading="lazy"
            />
            {/* Gradient fade — only when collapsed */}
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            )}
          </div>

          {/* "Voir plus" button overlapping the fade */}
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="absolute left-1/2 -translate-x-1/2 bottom-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-surface border border-border-warm rounded-full shadow-md text-sm font-semibold text-secondary active:scale-95 transition-transform"
            >
              {t('seeMorePhotos', { count: remainingCount })}
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Remaining images — only visible when expanded */}
      {expanded &&
        rest.map((url, i) => (
          <div key={url + i} className="w-[95%] rounded-xl overflow-hidden">
            <img
              src={url}
              alt={`${alt} - détail ${i + 3}`}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        ))}
    </div>
  );
}
