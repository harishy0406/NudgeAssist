'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Animated counter using anime.js.
 * Smooth number animation with configurable duration and formatting.
 */

interface CounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export default function CounterAnimation({
  target,
  duration = 1500,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}: CounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const currentValue = useRef(0);

  useEffect(() => {
    if (!counterRef.current) return;

    const runAnimation = () => {
      hasAnimated.current = true;
      const obj = { value: currentValue.current };
      anime({
        targets: obj,
        value: target,
        duration: duration,
        easing: 'easeOutExpo',
        round: decimals === 0 ? 1 : Math.pow(10, decimals),
        update: () => {
          currentValue.current = obj.value;
          if (counterRef.current) {
            counterRef.current.textContent =
              prefix + obj.value.toFixed(decimals) + suffix;
          }
        },
      });
    };

    if (hasAnimated.current) {
      runAnimation();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, [target, duration, suffix, prefix, decimals]);

  return (
    <span ref={counterRef} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
