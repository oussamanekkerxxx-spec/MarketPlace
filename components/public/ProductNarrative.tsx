'use client';

import { useEffect, useRef } from 'react';
import type { DetailSectionFormData } from '@/lib/validation/product';

interface ProductNarrativeProps {
  sections: DetailSectionFormData[];
  locale: string;
}

function useFallbackReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run fallback if CSS animation-timeline is NOT supported
    if (CSS.supports('animation-timeline', 'view()')) return;

    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll<HTMLElement>('.narrative-section');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return containerRef;
}

export function ProductNarrative({ sections, locale }: ProductNarrativeProps) {
  const containerRef = useFallbackReveal();

  const validSections = sections.filter((s) => s.image && s.image.trim().startsWith('http'));
  if (validSections.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-0">
      {validSections.map((section, index) => {
        const headline =
          section[`headline_${locale as 'fr' | 'en' | 'ar'}` as keyof DetailSectionFormData] ||
          section.headline_fr ||
          '';
        const body =
          section[`body_${locale as 'fr' | 'en' | 'ar'}` as keyof DetailSectionFormData] ||
          section.body_fr ||
          '';

        const isRTL = locale === 'ar';
        const hasContent = Boolean(headline) || Boolean(body);

        // Position classes
        const position = section.position || 'center';
        const theme = section.theme || 'light';

        const positionClasses = {
          center: 'items-center justify-center text-center',
          left: 'items-center justify-start text-left',
          right: 'items-center justify-end text-right',
        };

        // Theme classes
        const themeClasses = {
          light: 'text-white',
          dark: 'text-gray-900',
        };

        // Overlay gradient based on theme
        const overlayClass =
          theme === 'dark'
            ? 'from-white/70 via-white/30 to-transparent'
            : 'from-black/60 via-black/30 to-transparent';

        return (
          <section
            key={section.id}
            className="narrative-section relative w-full min-h-[100dvh] flex overflow-hidden"
            style={{ willChange: 'opacity, transform' }}
          >
            {/* Background image */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="narrative-bg absolute -left-[5%] -top-[5%] w-[110%] h-[110%]">
                <img
                  src={section.image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
              {/* Gradient overlay for text readability */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${overlayClass}`}
              />
            </div>

            {/* Content */}
            {hasContent && (
              <div
                className={`narrative-text relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 flex flex-col ${positionClasses[position]} ${themeClasses[theme]}`}
                dir={isRTL ? 'rtl' : 'ltr'}
                style={{ willChange: 'opacity, transform' }}
              >
                {headline && (
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                    {headline as string}
                  </h2>
                )}
                {body && (
                  <p className="mt-4 md:mt-6 text-lg sm:text-xl md:text-2xl max-w-2xl leading-relaxed opacity-90">
                    {body as string}
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
