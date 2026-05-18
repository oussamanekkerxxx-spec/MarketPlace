'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

const ZOOM_LEVEL = 2.2;
const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 300;
const DOUBLE_CLICK_WINDOW = 220;

export function ProductGallery({ images: rawImages, alt }: ProductGalleryProps) {
  const images = rawImages.filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Unified zoom state (desktop + mobile)
  const [isZoomed, setIsZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [animated, setAnimated] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const pendingClickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef(0);

  // Reset zoom when switching images
  useEffect(() => {
    setIsZoomed(false);
    setPan({ x: 0, y: 0 });
    if (pendingClickRef.current) {
      clearTimeout(pendingClickRef.current);
      pendingClickRef.current = null;
    }
  }, [selectedIndex]);

  const clampPan = useCallback((x: number, y: number): { x: number; y: number } => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const rect = el.getBoundingClientRect();
    const maxX = ((ZOOM_LEVEL - 1) * rect.width) / 2;
    const maxY = ((ZOOM_LEVEL - 1) * rect.height) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const zoomToPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const newPan = clampPan(
        rect.width / 2 - (clientX - rect.left),
        rect.height / 2 - (clientY - rect.top)
      );
      setAnimated(true);
      setPan(newPan);
      setIsZoomed(true);
    },
    [clampPan]
  );

  const zoomOut = useCallback(() => {
    setAnimated(true);
    setIsZoomed(false);
    setPan({ x: 0, y: 0 });
  }, []);

  // ─── Desktop mouse handlers ──────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      isDraggingRef.current = false;
      setAnimated(false);
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStartRef.current || !isZoomed) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        setIsDraggingState(true);
      }
      if (isDraggingRef.current) {
        const newPan = clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy);
        setPan(newPan);
      }
    },
    [isZoomed, clampPan]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const wasDragging = isDraggingRef.current;
      dragStartRef.current = null;
      isDraggingRef.current = false;
      setIsDraggingState(false);

      if (wasDragging) return;

      // Single vs double-click detection
      if (pendingClickRef.current) {
        // Second click within window → double-click → zoom out
        clearTimeout(pendingClickRef.current);
        pendingClickRef.current = null;
        zoomOut();
        return;
      }

      const { clientX, clientY } = e;
      pendingClickRef.current = setTimeout(() => {
        pendingClickRef.current = null;
        if (!isZoomed) {
          zoomToPoint(clientX, clientY);
        } else {
          // Reposition to clicked spot
          const el = containerRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const newPan = clampPan(
            rect.width / 2 - (clientX - rect.left),
            rect.height / 2 - (clientY - rect.top)
          );
          setAnimated(true);
          setPan(newPan);
        }
      }, DOUBLE_CLICK_WINDOW);
    },
    [isZoomed, zoomToPoint, zoomOut, clampPan]
  );

  const handleMouseLeave = useCallback(() => {
    dragStartRef.current = null;
    isDraggingRef.current = false;
    setIsDraggingState(false);
  }, []);

  // ─── Mobile touch handlers ───────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      isDraggingRef.current = false;
      setAnimated(false);
    },
    [pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isZoomed || !dragStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
      }
      if (isDraggingRef.current) {
        const newPan = clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy);
        setPan(newPan);
      }
    },
    [isZoomed, clampPan]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!dragStartRef.current) return;
      const wasDragging = isDraggingRef.current;
      dragStartRef.current = null;
      isDraggingRef.current = false;

      if (wasDragging) return;

      const touch = e.changedTouches[0];
      const now = Date.now();
      const isDoubleTap = now - lastTapTimeRef.current < DOUBLE_TAP_MS;
      lastTapTimeRef.current = now;

      if (isDoubleTap && isZoomed) {
        zoomOut();
      } else if (!isZoomed) {
        zoomToPoint(touch.clientX, touch.clientY);
      } else {
        // Reposition
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const newPan = clampPan(
          rect.width / 2 - (touch.clientX - rect.left),
          rect.height / 2 - (touch.clientY - rect.top)
        );
        setAnimated(true);
        setPan(newPan);
      }
    },
    [isZoomed, zoomToPoint, zoomOut, clampPan]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  const imageStyle: React.CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${isZoomed ? ZOOM_LEVEL : 1})`,
    transformOrigin: 'center center',
    transition: animated ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
  };

  const cursorClass = isZoomed
    ? isDraggingState
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : 'cursor-zoom-in';

  if (images.length === 0) {
    return (
      <div className="h-52 sm:h-64 lg:aspect-square lg:h-auto bg-surface-2 rounded-xl overflow-hidden relative flex items-center justify-center text-text-muted text-4xl font-bold">
        {alt.charAt(0)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`aspect-[4/3] sm:aspect-[4/3] lg:aspect-square bg-surface-2 rounded-xl overflow-hidden relative select-none ${cursorClass}`}
        style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
      >
        <Image
          src={images[selectedIndex]}
          alt={`${alt} - ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover will-change-transform motion-reduce:transition-none pointer-events-none"
          style={imageStyle}
          priority
        />

        {/* Zoom hint — fades once used */}
        {!isZoomed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm"
          >
            Cliquer pour zoomer
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`aspect-square bg-surface-2 rounded-lg overflow-hidden relative border-2 transition-colors ${
                i === selectedIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-border-warm'
              }`}
            >
              <Image src={img} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
