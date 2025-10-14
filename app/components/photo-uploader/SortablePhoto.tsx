import { X, Check, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortablePhotoProps } from '@/types/photo';

export function SortablePhoto({
  id,
  index,
  photo,
  onRemove,
  isSelectionMode,
  isSelected,
  onToggleSelection,
}: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const quality = photo.quality;
  const statusIcon = quality ? (
    quality.status === 'excellent' ? (
      <Check className="w-4 h-4" />
    ) : quality.status === 'good' ? (
      <AlertTriangle className="w-4 h-4" />
    ) : (
      <X className="w-4 h-4" />
    )
  ) : (
    <Check className="w-4 h-4" />
  );

  const statusColor = quality
    ? quality.status === 'excellent'
      ? 'bg-green-500'
      : quality.status === 'good'
      ? 'bg-yellow-500'
      : 'bg-red-500'
    : 'bg-green-500';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isSelectionMode ? {} : attributes)}
      {...(isSelectionMode ? {} : listeners)}
      onClick={() => isSelectionMode && onToggleSelection(index)}
      className={`relative aspect-square rounded-xl overflow-hidden group ${
        isSelectionMode ? 'cursor-pointer' : 'cursor-move'
      } ${isDragging ? 'z-50 shadow-2xl' : ''} ${
        quality?.status === 'poor' ? 'ring-2 ring-red-400' : ''
      } ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
      title={quality?.issues.join(', ') || '质量良好'}
    >
      <Image
        src={photo.dataUrl}
        alt={`Upload ${index + 1}`}
        fill
        className="object-cover"
        placeholder="blur"
        blurDataURL={photo.dataUrl}
        sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 10vw"
      />

      {!isSelectionMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-10">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
              isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-gray-300'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      <div className={`absolute bottom-2 right-2 p-1.5 ${statusColor} text-white rounded-full`}>
        {statusIcon}
      </div>

      <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>

      {quality && quality.status !== 'excellent' && !isSelectionMode && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-white font-medium">{quality.issues.join(', ')}</p>
        </div>
      )}

      {isSelected && <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />}
    </div>
  );
}
