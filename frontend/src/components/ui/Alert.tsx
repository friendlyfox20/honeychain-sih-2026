import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

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
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-2xl border ${styles[type]} text-xs leading-relaxed ${className}`}
    >
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1 space-y-1">
        {title && <h4 className="font-semibold text-sm text-white">{title}</h4>}
        <div className="text-slate-300">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
