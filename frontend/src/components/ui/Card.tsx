import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  amber?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = false,
  amber = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${
        amber
          ? 'glass-card-amber'
          : 'glass-card'
      } ${glow ? 'glow-honey' : ''} ${className}`}
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
    <div className={`p-6 pb-4 border-b border-white/5 flex items-start justify-between gap-4 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 pt-3 border-t border-white/5 bg-slate-900/30 rounded-b-2xl ${className}`}>{children}</div>;
};
