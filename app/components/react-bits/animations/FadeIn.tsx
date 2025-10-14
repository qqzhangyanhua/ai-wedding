'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { gsap } from 'gsap';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export default function FadeIn({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  direction = 'up',
  distance = 30
}: FadeInProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const directionMap = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
      none: {}
    };

    gsap.fromTo(
      elementRef.current,
      {
        opacity: 0,
        ...directionMap[direction]
      },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        ease: 'power3.out'
      }
    );
  }, [delay, duration, direction, distance]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
