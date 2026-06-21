'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Staggered list reveal animation using anime.js.
 * Animates children into view with configurable delay and direction.
 */

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  triggerOnMount?: boolean;
}

export default function StaggeredList({
  children,
  className = '',
  delay = 0,
  staggerDelay = 60,
  direction = 'up',
  triggerOnMount = true,
}: StaggeredListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const items = containerRef.current.children;
    if (items.length === 0) return;

    const translateMap = {
      up: { translateY: [30, 0] },
      down: { translateY: [-30, 0] },
      left: { translateX: [30, 0] },
      right: { translateX: [-30, 0] },
    };

    if (triggerOnMount) {
      hasAnimated.current = true;
      anime({
        targets: items,
        opacity: [0, 1],
        ...translateMap[direction],
        scale: [0.95, 1],
        duration: 500,
        delay: anime.stagger(staggerDelay, { start: delay }),
        easing: 'easeOutCubic',
      });
    } else {
      // Intersection Observer for scroll-triggered animation
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated.current) {
              hasAnimated.current = true;
              anime({
                targets: items,
                opacity: [0, 1],
                ...translateMap[direction],
                scale: [0.95, 1],
                duration: 500,
                delay: anime.stagger(staggerDelay, { start: delay }),
                easing: 'easeOutCubic',
              });
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [delay, staggerDelay, direction, triggerOnMount]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
