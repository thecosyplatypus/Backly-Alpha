import React, { useEffect, useRef, useState, useCallback } from 'react';

export function useLazyImage(src: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    const img = new Image();
    imgRef.current = img;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error };
}

export function LazyImage({ src, alt, className, fallback }: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const { loaded, error } = useLazyImage(src);
  const showFallback = !loaded || error;

  if (showFallback) {
    const initials = alt.split(/[\s-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className={`${className} bg-surface-800 flex items-center justify-center text-gold-500 font-bold text-xs overflow-hidden`}>
        {fallback ? (
          <img src={fallback} alt={alt} className={`${className} object-cover`} />
        ) : (
          initials
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover transition-opacity duration-300`}
      loading="lazy"
    />
  );
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callbackRef.current();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}

export function useInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const sentinelRef = useIntersectionObserver(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  });

  return sentinelRef;
}

export function useThrottle(callback: () => void, delay: number) {
  const lastCall = useRef(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(() => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callbackRef.current();
    }
  }, [delay]);
}

export function VirtualList({ items, itemHeight, renderItem, overscan = 5 }: {
  items: any[];
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      className="overflow-y-auto scrollbar-hide"
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIndex * itemHeight, left: 0, right: 0 }}>
          {visibleItems.map((item, i) => renderItem(item, startIndex + i))}
        </div>
      </div>
    </div>
  );
}


