/**
 * PhotoUploader - 重构后主组件
 * 从 509 行压缩到 < 150 行
 *
 * 改进：
 * 1. 提取 hooks: usePhotoUpload, usePhotoSelection
 * 2. 提取子组件: SortablePhoto, PhotoUploadZone, PhotoUploadGuide
 * 3. 单一职责：仅负责组合和布局
 */

import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
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
} from '@dnd-kit/sortable';
import { PhotoUploaderProps } from '@/types/photo';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { usePhotoSelection } from '@/hooks/usePhotoSelection';
import { SortablePhoto } from './photo-uploader/SortablePhoto';
import { PhotoUploadZone } from './photo-uploader/PhotoUploadZone';
import { PhotoUploadGuide } from './photo-uploader/PhotoUploadGuide';
import { PhotoGuideModal } from './PhotoGuideModal';
import { ConfirmDialog } from './ConfirmDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function PhotoUploader({ photos, onChange, onIdentifyErrorCountChange, maxPhotos = 10, minPhotos = 1 }: PhotoUploaderProps) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeletePoorConfirm, setShowDeletePoorConfirm] = useState(false);

  const {
    photosWithQuality,
    isAnalyzing,
    poorQualityCount,
    identifyErrors,
    identifyErrorCount,
    criticalError,
    clearCriticalError,
    handleFileSelect,
    removePhoto,
    reorderPhotos,
    clearAllPhotos,
    deletePoorQualityPhotos,
    syncPhotos,
  } = usePhotoUpload({ maxPhotos, onPhotosChange: onChange });

  const {
    selectedIndices,
    isSelectionMode,
    setIsSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    exitSelectionMode,
  } = usePhotoSelection();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = photosWithQuality.findIndex((_, i) => `photo-${i}` === active.id);
      const newIndex = photosWithQuality.findIndex((_, i) => `photo-${i}` === over.id);
      reorderPhotos(arrayMove(photosWithQuality, oldIndex, newIndex));
    }
  };

  // 同步外部 photos 状态
  syncPhotos(photos);

  // 通知父组件识别错误数量变化
  useEffect(() => {
    if (onIdentifyErrorCountChange) {
      onIdentifyErrorCountChange(identifyErrorCount);
    }
  }, [identifyErrorCount, onIdentifyErrorCountChange]);

  return (
    <div className="space-y-4">
      <PhotoUploadGuide minPhotos={minPhotos} onOpenGuideModal={() => setShowGuideModal(true)} />

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
                  onClick={() => setShowDeletePoorConfirm(true)}
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
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                清空所有
              </button>
            </>
          )}
          {isSelectionMode && (
            <>
              <button type="button" onClick={() => selectAll(photosWithQuality.length)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                全选
              </button>
              <button type="button" onClick={deselectAll} className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                取消选择
              </button>
              {selectedIndices.size > 0 && (
                <button
                  type="button"
                  onClick={() => deleteSelected(photosWithQuality, reorderPhotos)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  删除选中({selectedIndices.size})
                </button>
              )}
              <button type="button" onClick={exitSelectionMode} className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                完成
              </button>
            </>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          正在验证和分析照片...
        </div>
      )}

      {identifyErrorCount > 0 && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">发现 {identifyErrorCount} 张照片未检测到人物</p>
            <p>这些照片未上传到服务器，请删除并重新上传包含人物的照片</p>
            <ul className="mt-2 space-y-1">
              {Array.from(identifyErrors.entries()).map(([index, error]) => (
                <li key={index} className="text-xs">
                  • 第 {index + 1} 张: {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {poorQualityCount > 0 && (
        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">发现 {poorQualityCount} 张照片质量不佳</p>
            <p>建议替换质量不合格的照片以获得最佳效果</p>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photosWithQuality.map((_, i) => `photo-${i}`)} strategy={rectSortingStrategy}>
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
                identifyError={identifyErrors.get(index)}
              />
            ))}
            {photos.length < maxPhotos && <PhotoUploadZone onFileSelect={handleFileSelect} />}
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

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="确认清空所有照片？"
        message="此操作将删除所有已上传的照片，且无法恢复。确定要继续吗？"
        confirmText="确认清空"
        cancelText="取消"
        variant="danger"
        onConfirm={() => {
          clearAllPhotos();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeletePoorConfirm}
        title="确认删除低质量照片？"
        message={`将删除 ${poorQualityCount} 张质量不合格的照片。建议删除后重新上传高质量照片以获得最佳效果。`}
        confirmText="确认删除"
        cancelText="取消"
        variant="warning"
        onConfirm={() => {
          deletePoorQualityPhotos();
          setShowDeletePoorConfirm(false);
        }}
        onCancel={() => setShowDeletePoorConfirm(false)}
      />

      {/* 识别服务错误弹窗 */}
      <AlertDialog open={!!criticalError} onOpenChange={(open) => !open && clearCriticalError()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">识别服务失败</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-gray-700">
              <div className="space-y-3">
                <p>照片识别服务暂时不可用，无法验证照片是否包含人物。</p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-1">错误详情：</p>
                  <p className="text-sm text-red-800 font-mono break-all">{criticalError}</p>
                </div>
                <p className="text-sm">请稍后重试，或联系管理员检查识别服务配置。</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={clearCriticalError}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              我知道了
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
