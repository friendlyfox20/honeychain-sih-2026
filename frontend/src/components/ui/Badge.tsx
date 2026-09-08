import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'rose' | 'blue' | 'purple' | 'slate' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    emerald: 'bg-forest-50 text-forest-700 border-forest-200',
    amber: 'bg-honey-100 text-honey-800 border-honey-200',
    rose: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    slate: 'bg-surface-tint text-charcoal-muted border-border-warm',
    default: 'bg-surface-tint text-charcoal border-border-warm',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
    lg: 'text-xs px-3 py-1.5 font-semibold rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-mono tracking-normal ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let variant: 'amber' | 'emerald' | 'rose' | 'blue' | 'purple' | 'slate' = 'slate';

  if (['PASSED', 'PASS', 'NORMAL', 'VERIFIED', 'ANCHORED', 'COMPLETED'].includes(normalized)) {
    variant = 'emerald';
  } else if (['FLAGGED', 'FAIL', 'FAILED', 'ANOMALY', 'TAMPERED'].includes(normalized)) {
    variant = 'rose';
  } else if (['CREATED', 'HARVESTED', 'IN_PROCESSING', 'PENDING'].includes(normalized)) {
    variant = 'amber';
  } else if (['PACKAGED', 'DISTRIBUTED', 'COLLECTED'].includes(normalized)) {
    variant = 'blue';
  }

  return (
    <Badge variant={variant} size={size}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === 'emerald' ? 'bg-forest-600' :
        variant === 'rose' ? 'bg-terracotta-600' :
        variant === 'amber' ? 'bg-honey-600' :
        variant === 'blue' ? 'bg-sky-600' : 'bg-charcoal-light'
      }`} />
      {status}
    </Badge>
  );
};
