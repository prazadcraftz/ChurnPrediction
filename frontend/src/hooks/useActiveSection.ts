import { useState, useEffect, useRef } from 'react';

const SECTION_IDS = ['kpis', 'drivers', 'segments', 'tenure', 'predictions', 'recommendations'];

/**
 * Returns the ID of the section currently most visible in the viewport.
 * Used to highlight active anchor links in the dashboard nav.
 */
export function useActiveSection(): string {
  const [activeId, setActiveId] = useState<string>('kpis');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionMap = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionMap.set(entry.target.id, entry.intersectionRatio);
        });

        // Pick the section with highest intersection ratio
        let topId = 'kpis';
        let topRatio = -1;
        sectionMap.forEach((ratio, id) => {
          if (ratio > topRatio) {
            topRatio = ratio;
            topId = id;
          }
        });

        if (topRatio > 0) setActiveId(topId);
      },
      {
        root: null,
        rootMargin: '-10% 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    );

    const observer = observerRef.current;

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return activeId;
}
