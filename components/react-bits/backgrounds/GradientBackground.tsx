'use client';

import { ReactNode } from 'react';
import './GradientBackground.css';

interface GradientBackgroundProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  blur?: number;
}

export default function GradientBackground({
  children,
  className = '',
  colors = ['#8B5CF6', '#EC4899', '#3B82F6'],
  blur = 100
}: GradientBackgroundProps) {
  return (
    <div className={`gradient-bg-container ${className}`}>
      <div className="gradient-bg-wrapper" style={{ filter: `blur(${blur}px)` }}>
        <div
          className="gradient-bg-orb gradient-bg-orb-1"
          style={{ background: colors[0] }}
        />
        <div
          className="gradient-bg-orb gradient-bg-orb-2"
          style={{ background: colors[1] }}
        />
        <div
          className="gradient-bg-orb gradient-bg-orb-3"
          style={{ background: colors[2] }}
        />
      </div>
      <div className="gradient-bg-content">
        {children}
      </div>
    </div>
  );
}
