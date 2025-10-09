import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const Icon = icons[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors[type]} min-w-[300px]`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
