import React from 'react';

export interface AuroraTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children: React.ReactNode;
  speed?: number;
}

export const AuroraText: React.FC<AuroraTextProps> = ({
  className = '',
  children,
  speed = 4,
  style,
  ...props
}) => {
  return (
    <span
      className={`relative inline-block text-transparent bg-clip-text bg-[linear-gradient(90deg,#ff0080,#7928ca,#0070f3,#38bdf8,#ff0080)] bg-[length:300%_auto] ${className}`}
      style={{
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `auroraSweep ${speed}s linear infinite`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
