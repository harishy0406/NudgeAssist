'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Animated particle background using anime.js.
 * Creates floating geometric shapes with parallax effects.
 * Auto-reduces particles on mobile for performance.
 */
export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 12 : 30;

    // Clear existing particles
    container.innerHTML = '';

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * (isMobile ? 4 : 6) + 2;
      const isSquare = Math.random() > 0.7;

      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = isSquare ? '2px' : '50%';
      particle.style.background = `hsl(${230 + Math.random() * 40}, 80%, ${55 + Math.random() * 25}%)`;
      particle.style.opacity = '0';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.classList.add('bg-particle');

      container.appendChild(particle);
    }

    // Animate particles with anime.js
    anime({
      targets: container.querySelectorAll('.bg-particle'),
      opacity: [0, () => Math.random() * 0.12 + 0.03],
      translateX: () => anime.random(-80, 80),
      translateY: () => anime.random(-80, 80),
      scale: [0, () => Math.random() * 1.5 + 0.5],
      duration: () => anime.random(3000, 6000),
      delay: anime.stagger(100),
      easing: 'easeOutExpo',
      complete: () => {
        // Continuous floating animation
        anime({
          targets: container.querySelectorAll('.bg-particle'),
          translateX: () => `+=${anime.random(-40, 40)}`,
          translateY: () => `+=${anime.random(-40, 40)}`,
          duration: () => anime.random(4000, 8000),
          easing: 'easeInOutSine',
          direction: 'alternate',
          loop: true,
        });
      },
    });

    // Parallax on mouse move (desktop only)
    if (!isMobile) {
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        anime({
          targets: container,
          translateX: x,
          translateY: y,
          duration: 1500,
          easing: 'easeOutQuad',
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="particles-bg"
      aria-hidden="true"
    />
  );
}
