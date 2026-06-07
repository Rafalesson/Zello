'use client';

import { RefObject, useEffect } from 'react';

type RevealOptions = IntersectionObserverInit;

export function useScrollReveal<T extends HTMLElement>(ref: RefObject<T | null>, options?: RevealOptions) {
  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const elements = Array.from(node.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observerInstance.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        ...options,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [ref, options]);
}
