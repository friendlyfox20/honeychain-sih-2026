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
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    blue: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
        variant === 'emerald' ? 'bg-emerald-400' :
        variant === 'rose' ? 'bg-rose-400' :
        variant === 'amber' ? 'bg-amber-400 animate-pulse' :
        variant === 'blue' ? 'bg-sky-400' : 'bg-slate-400'
      }`} />
      {status}
    </Badge>
  );
};
