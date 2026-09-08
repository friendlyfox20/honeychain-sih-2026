import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'tinted' | 'flat' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-border-warm rounded-xl shadow-subtle',
    tinted: 'bg-surface-tint border border-border-warm rounded-xl',
    flat: 'bg-white border border-border-subtle rounded-xl',
    interactive: 'bg-white border border-border-warm rounded-xl shadow-subtle hover:border-border-strong hover:shadow-elevated transition-all cursor-pointer',
  };

  return (
    <div
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, badge, action, className = '' }) => {
  return (
    <div className={`p-5 pb-4 border-b border-border-subtle flex items-start justify-between gap-4 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-charcoal tracking-tight font-display">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-charcoal-muted leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 pt-3.5 border-t border-border-subtle bg-surface-subtle rounded-b-xl ${className}`}>{children}</div>;
};
