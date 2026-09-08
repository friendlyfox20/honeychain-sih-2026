import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'honey' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variantStyles = {
    primary: 'bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white border border-forest-800/40 shadow-subtle',
    secondary: 'bg-white hover:bg-surface-tint active:bg-surface-subtle text-charcoal border border-border-warm hover:border-border-strong shadow-subtle',
    honey: 'bg-honey-600 hover:bg-honey-700 active:bg-honey-800 text-white border border-honey-700/40 shadow-subtle',
    outline: 'bg-transparent hover:bg-surface-tint text-charcoal border border-border-warm hover:border-border-strong',
    ghost: 'bg-transparent hover:bg-surface-tint text-charcoal-muted hover:text-charcoal',
    danger: 'bg-terracotta-700 hover:bg-terracotta-800 active:bg-terracotta-900 text-white border border-terracotta-800/40 shadow-subtle',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[34px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 min-h-[48px] gap-2.5', // Touch friendly >= 44px
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
