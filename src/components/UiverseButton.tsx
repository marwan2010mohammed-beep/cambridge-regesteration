import React from 'react';

export interface UiverseButtonProps {
  id?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  disabled?: boolean;
  variant?: 'default' | 'discord' | 'emerald' | 'cyan' | 'amber' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  as?: 'button' | 'a';
  href?: string;
  target?: string;
  rel?: string;
  role?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}

export const UiverseButton: React.FC<UiverseButtonProps> = ({
  id,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  children,
  icon,
  iconRight,
  className = '',
  style,
  title,
  as = 'button',
  href,
  target,
  rel,
  role,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
}) => {
  const variantClass = `btn-wrapper--${variant}`;
  const sizeClass = `btn-wrapper--${size}`;
  const fullWidthClass = fullWidth ? 'btn-wrapper--full' : '';
  const disabledClass = disabled ? 'btn-wrapper--disabled' : '';

  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      {icon && <span className="btn-icon-prefix" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {iconRight && <span className="btn-icon-suffix" aria-hidden="true">{iconRight}</span>}
    </span>
  );

  if (as === 'a' && href) {
    return (
      <div
        className={`btn-wrapper ${variantClass} ${sizeClass} ${fullWidthClass} ${disabledClass} ${className}`}
        style={style}
        title={title}
      >
        <a
          id={id}
          href={disabled ? undefined : href}
          target={target}
          rel={rel}
          onClick={disabled ? (e) => e.preventDefault() : onClick}
          className="gradient-btn"
          role={role}
          aria-label={ariaLabel}
          aria-disabled={disabled}
        >
          {content}
        </a>
        <div className="btn-backdrop-tint" aria-hidden="true" />
        <div className="gradient-layer" aria-hidden="true" />
        <div className="gradient-layer" aria-hidden="true" />
        <div className="light" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={`btn-wrapper ${variantClass} ${sizeClass} ${fullWidthClass} ${disabledClass} ${className}`}
      style={style}
      title={title}
    >
      <button
        id={id}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="gradient-btn"
        role={role}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
      >
        {content}
      </button>
      <div className="btn-backdrop-tint" aria-hidden="true" />
      <div className="gradient-layer" aria-hidden="true" />
      <div className="gradient-layer" aria-hidden="true" />
      <div className="light" aria-hidden="true" />
    </div>
  );
};
