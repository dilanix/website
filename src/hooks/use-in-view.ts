"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element first scrolls into view, then disconnects.
 * Used to trigger reveal transitions and count-up numbers without re-running
 * on every subsequent scroll in/out.
 */
export function useInView<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0.2 },
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options is expected to be a stable literal at call sites
  }, []);

  return { ref, inView };
}
