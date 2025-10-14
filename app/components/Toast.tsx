import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

// 根据类型自动设置持续时间
const getDefaultDuration = (type: ToastProps['type']) => {
  switch (type) {
    case 'success':
      return 3000; // 3秒
    case 'error':
      return 5000; // 5秒
    case 'warning':
      return 4000; // 4秒
    case 'info':
      return 3000; // 3秒
    default:
      return 3000;
  }
};

export function Toast({ message, type = 'success', onClose, duration }: ToastProps) {
  const finalDuration = duration ?? getDefaultDuration(type);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, finalDuration);

    return () => clearTimeout(timer);
  }, [finalDuration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  const styles = {
    success: {
      bg: 'bg-champagne border-rose-gold/30',
      text: 'text-navy',
      icon: 'text-rose-gold'
    },
    error: {
      bg: 'bg-destructive/10 border-destructive/30',
      text: 'text-destructive',
      icon: 'text-destructive'
    },
    info: {
      bg: 'bg-ivory border-stone/20',
      text: 'text-navy',
      icon: 'text-dusty-rose'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-300',
      text: 'text-yellow-900',
      icon: 'text-yellow-600'
    }
  };

  const Icon = icons[type];
  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-lg border-2 shadow-xl backdrop-blur-sm ${style.bg} ${style.text} min-w-[320px] max-w-md`}>
        <Icon className={`w-6 h-6 flex-shrink-0 ${style.icon}`} />
        <p className="flex-1 font-medium text-sm leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-stone/10 rounded-md transition-colors flex-shrink-0"
          aria-label="关闭提示"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
