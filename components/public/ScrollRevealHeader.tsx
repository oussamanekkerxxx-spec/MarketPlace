'use client';

import { useEffect } from 'react';

export function ScrollRevealHeader() {
  useEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;

    const trigger = window.innerHeight * 0.5;
    let ticking = false;

    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > trigger);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
