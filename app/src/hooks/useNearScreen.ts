import { useEffect, useRef, useState } from 'react';

interface UseNearScreenOptions {
  distance?: string;
}

export function useNearScreen({ distance = '300px' }: UseNearScreenOptions = {}) {
  const [isNearScreen, setIsNearScreen] = useState(false);
  const fromRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = fromRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsNearScreen(true);
          observer.disconnect();
        }
      },
      { rootMargin: distance }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [distance]);

  return { isNearScreen, fromRef };
}
