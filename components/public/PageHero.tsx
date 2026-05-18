interface PageHeroProps {
  title: string;
  subtitle?: string;
}

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="relative bg-secondary overflow-hidden">
      <div className="absolute inset-0 moroccan-pattern opacity-30" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              À propos
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.1] tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base lg:text-lg text-white/70 max-w-lg leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {/* Bottom fade to background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
