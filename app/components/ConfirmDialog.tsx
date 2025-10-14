import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-500',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'bg-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'bg-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="bg-ivory rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 ${styles.icon} rounded-full flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-display font-semibold text-navy mb-2">{title}</h3>
              <p className="text-stone leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-stone/10 rounded-md transition-colors"
              aria-label="关闭对话框"
            >
              <X className="w-5 h-5 text-stone" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-champagne text-navy rounded-lg hover:bg-stone/20 transition-all font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 px-4 py-3 ${styles.button} text-white rounded-lg transition-all font-medium shadow-md`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


