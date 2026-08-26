import React from 'react';

export interface AnimatedGradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  children: React.ReactNode;
}

export function AnimatedGradientText({
  speed = 2,
  colorFrom = '#4ade80',
  colorTo = '#06b6d4',
  className = '',
  children,
  style,
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colorFrom}, ${colorTo}, ${colorFrom})`,
        backgroundSize: '200% auto',
        animation: `gradientMove ${speed}s linear infinite`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
