'use client';

import { ReactNode } from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
}

export default function GlassCard({
  children,
  className = '',
  blur = 10,
  opacity = 0.1,
  borderOpacity = 0.2
}: GlassCardProps) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        backdropFilter: `blur(${blur}px)`,
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`
      }}
    >
      {children}
    </div>
  );
}
