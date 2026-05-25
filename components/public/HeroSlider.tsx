'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface HeroSliderProps {
  images: { url: string; alt_text?: string | null }[];
  fallbackAlt: string;
  /** Small overline text pinned in the corner above the slides; persists across image transitions. */
  eyebrow?: string;
}

const SLIDE_INTERVAL = 5000; // 5 seconds
const TRANSITION_DURATION = 700; // ms

export function HeroSlider({ images, fallbackAlt, eyebrow }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % images.length);
  }, [current, images.length, goTo]);

  // Auto-slide
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [next, images.length]);

  // If only 1 image, render static
  if (images.length <= 1) {
    const img = images[0];
    return (
      <div className="relative w-full h-[45vh] sm:h-[50vh] lg:h-[55vh]">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt_text || fallbackAlt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/70" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary to-transparent" />
        {eyebrow && <HeroEyebrow text={eyebrow} />}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[45vh] sm:h-[50vh] lg:h-[55vh] overflow-hidden">
      {/* Slides */}
      {images.map((img, index) => (
        <div
          key={img.url}
          className="absolute inset-0 transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(${(index - current) * 100}%)`,
          }}
        >
          <Image
            src={img.url}
            alt={img.alt_text || fallbackAlt}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Bottom gradient for smooth transition to text band */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary to-transparent z-10" />

      {/* Fixed eyebrow badge — sits above all slides, persists across transitions */}
      {eyebrow && <HeroEyebrow text={eyebrow} />}

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Aller à la slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Small pill pinned in the top corner of the hero, sitting above the carousel slides. */
function HeroEyebrow({ text }: { text: string }) {
  return (
    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] shadow-sm">
        {text}
      </span>
    </div>
  );
}
