import { MoreVertical, Eye, Edit, Trash2, RefreshCw, Share2, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ProjectActionsMenuProps {
  projectId: string;
  projectName: string;
  status: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export function ProjectActionsMenu({
  projectId,
  projectName,
  status,
  onView,
  onEdit,
  onDelete,
  onRegenerate,
  onShare,
  onDownload,
}: ProjectActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void | undefined) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(false);
      if (action) action();
    };
  };

  const isCompleted = status === 'completed';
  const isProcessing = status === 'processing' || status === 'pending';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-lg hover:bg-white/20 transition-all"
        aria-label="更多操作"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {onView && isCompleted && (
            <button
              onClick={handleAction(onView)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <Eye className="w-4 h-4" />
              <span>查看结果</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={handleAction(onEdit)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <Edit className="w-4 h-4" />
              <span>编辑项目</span>
            </button>
          )}

          {onRegenerate && isCompleted && (
            <button
              onClick={handleAction(onRegenerate)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新生成</span>
            </button>
          )}

          {onDownload && isCompleted && (
            <button
              onClick={handleAction(onDownload)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <Download className="w-4 h-4" />
              <span>下载全部</span>
            </button>
          )}

          {onShare && isCompleted && (
            <button
              onClick={handleAction(onShare)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <Share2 className="w-4 h-4" />
              <span>分享链接</span>
            </button>
          )}

          {onDelete && (
            <>
              <div className="my-1 border-t border-gray-200" />
              <button
                onClick={handleAction(onDelete)}
                className="w-full px-4 py-2.5 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除项目</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
