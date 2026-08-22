import React from 'react';

interface UiverseLoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UiverseLoader: React.FC<UiverseLoaderProps> = ({
  label = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const scale = size === 'sm' ? 0.65 : size === 'lg' ? 1.2 : 0.9;

  return (
    <div
      className={`uiverse-loader-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px 0',
      }}
    >
      <div
        className="uiverse-loader-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          marginBottom: size === 'sm' ? '-12px' : '4px',
        }}
      >
        <div className="circle" />
        <div className="circle" />
        <div className="circle" />
        <div className="shadow" />
        <div className="shadow" />
        <div className="shadow" />
      </div>
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: size === 'sm' ? '10px' : size === 'lg' ? '13px' : '11px',
            color: 'var(--text-dim, #a1a1aa)',
            letterSpacing: '0.06em',
            textAlign: 'center',
            textTransform: 'uppercase',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
