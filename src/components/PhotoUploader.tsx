import { useState } from 'react';
import { X, Check, Upload, AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { checkImageQuality, QualityResult } from '@/lib/image-quality-checker';
import { PhotoGuideModal } from './PhotoGuideModal';

interface PhotoWithQuality {
  dataUrl: string;
  quality?: QualityResult;
}

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  minPhotos?: number;
}

interface SortablePhotoProps {
  id: string;
  index: number;
  photo: PhotoWithQuality;
  onRemove: (index: number) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (index: number) => void;
}

function SortablePhoto({ id, index, photo, onRemove, isSelectionMode, isSelected, onToggleSelection }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />
      )}
    </div>
  );
}

export function PhotoUploader({ photos, onChange, maxPhotos = 10, minPhotos = 5 }: PhotoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [photosWithQuality, setPhotosWithQuality] = useState<PhotoWithQuality[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photosWithQuality.findIndex((_, i) => `photo-${i}` === active.id);
      const newIndex = photosWithQuality.findIndex((_, i) => `photo-${i}` === over.id);
      const reordered = arrayMove(photosWithQuality, oldIndex, newIndex);
      setPhotosWithQuality(reordered);
      onChange(reordered.map(p => p.dataUrl));
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setIsAnalyzing(true);
    const newPhotos: PhotoWithQuality[] = [];

    for (let i = 0; i < files.length; i++) {
      if (photos.length + newPhotos.length >= maxPhotos) break;
      const file = files[i];
      const dataUrl = await fileToDataUrl(file);

      try {
        const quality = await checkImageQuality(dataUrl);
        newPhotos.push({ dataUrl, quality });
      } catch (error) {
        console.error('质量检测失败:', error);
        newPhotos.push({ dataUrl });
      }
    }

    const updated = [...photosWithQuality, ...newPhotos];
    setPhotosWithQuality(updated);
    onChange(updated.map(p => p.dataUrl));
    setIsAnalyzing(false);
  };

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const removePhoto = (index: number) => {
    const updated = photosWithQuality.filter((_, i) => i !== index);
    setPhotosWithQuality(updated);
    onChange(updated.map(p => p.dataUrl));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (photosWithQuality.length !== photos.length) {
    const synced = photos.map((dataUrl, i) => photosWithQuality[i] || { dataUrl });
    if (JSON.stringify(synced.map(p => p.dataUrl)) !== JSON.stringify(photosWithQuality.map(p => p.dataUrl))) {
      setPhotosWithQuality(synced);
    }
  }

  const poorQualityCount = photosWithQuality.filter(p => p.quality?.status === 'poor').length;

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedIndices(newSelection);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(photosWithQuality.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const deleteSelected = () => {
    const updated = photosWithQuality.filter((_, i) => !selectedIndices.has(i));
    setPhotosWithQuality(updated);
    onChange(updated.map(p => p.dataUrl));
    setSelectedIndices(new Set());
    setIsSelectionMode(false);
  };

  const deletePoorQuality = () => {
    const updated = photosWithQuality.filter(p => p.quality?.status !== 'poor');
    setPhotosWithQuality(updated);
    onChange(updated.map(p => p.dataUrl));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          上传照片 ({photos.length}/{maxPhotos})
        </label>
        <div className="flex items-center gap-2">
          {photos.length > 0 && !isSelectionMode && (
            <>
              {poorQualityCount > 0 && (
                <button
                  type="button"
                  onClick={deletePoorQuality}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  删除低质量照片
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSelectionMode(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                批量选择
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhotosWithQuality([]);
                  onChange([]);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                清空所有
              </button>
            </>
          )}
          {isSelectionMode && (
            <>
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                全选
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                取消选择
              </button>
              {selectedIndices.size > 0 && (
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  删除选中({selectedIndices.size})
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIndices(new Set());
                }}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                完成
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-500 flex-1">
          上传{minPhotos}-{maxPhotos}张高质量照片，从不同角度清晰展现您的面部。拖动照片可调整顺序。
          {isAnalyzing && <span className="text-blue-600 font-medium ml-2">正在分析照片质量...</span>}
        </p>
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
        >
          <HelpCircle className="w-4 h-4" />
          查看示例
        </button>
      </div>

      {poorQualityCount > 0 && (
        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">发现 {poorQualityCount} 张照片质量不佳</p>
            <p>建议替换质量不合格的照片以获得最佳效果</p>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photosWithQuality.map((_, i) => `photo-${i}`)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {photosWithQuality.map((photo, index) => (
              <SortablePhoto
                key={`photo-${index}`}
                id={`photo-${index}`}
                index={index}
                photo={photo}
                onRemove={removePhoto}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIndices.has(index)}
                onToggleSelection={toggleSelection}
              />
            ))}

            {photos.length < maxPhotos && (
              <label
                className={`aspect-square border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500 font-medium text-center px-2">
                  {isDragOver ? '释放添加' : '添加照片'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {photos.length < minPhotos && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">请上传至少{minPhotos}张照片才能继续</p>
            <p>更多照片带来更好效果。请确保照片清晰、光线良好，并从不同角度展示您的面部。</p>
          </div>
        </div>
      )}

      <PhotoGuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
}
