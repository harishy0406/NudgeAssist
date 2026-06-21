'use client';

import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * 3D Floating Card with perspective tilt on hover.
 * Uses CSS perspective + Framer Motion for smooth 3D transforms.
 * Touch-compatible on mobile.
 */

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  onClick?: () => void;
}

export default function FloatingCard({
  children,
  className = '',
  intensity = 10,
  glowColor = 'rgba(99, 102, 241, 0.15)',
  onClick,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setRotateX((y - 0.5) * -intensity);
    setRotateY((x - 0.5) * intensity);
    setGlowPosition({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowPosition({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`glass-card ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, ${glowColor}, transparent 60%), var(--glass-bg)`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.div>
  );
}
