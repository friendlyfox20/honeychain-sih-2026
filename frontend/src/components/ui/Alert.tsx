import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-surface-tint border-border-warm text-charcoal',
      icon: <Info className="w-5 h-5 text-charcoal-muted shrink-0 mt-0.5" />,
    },
    success: {
      container: 'bg-forest-50 border-forest-200 text-forest-900',
      icon: <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0 mt-0.5" />,
    },
    warning: {
      container: 'bg-honey-50 border-honey-200 text-honey-900',
      icon: <AlertTriangle className="w-5 h-5 text-honey-600 shrink-0 mt-0.5" />,
    },
    error: {
      container: 'bg-terracotta-50 border-terracotta-200 text-terracotta-900',
      icon: <XCircle className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1 text-xs sm:text-sm leading-relaxed">
        {title && <h4 className="font-semibold mb-0.5 text-inherit font-display">{title}</h4>}
        <div className="opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/5 text-inherit opacity-70 hover:opacity-100 transition shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
