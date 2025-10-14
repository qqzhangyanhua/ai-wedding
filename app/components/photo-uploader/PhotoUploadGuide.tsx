import { Camera, ArrowRight } from 'lucide-react';

interface PhotoUploadGuideProps {
  minPhotos: number;
  onOpenGuideModal: () => void;
}

export function PhotoUploadGuide({ minPhotos, onOpenGuideModal }: PhotoUploadGuideProps) {
  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <h4 className="font-medium text-navy mb-3 flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-600" />
        上传照片小贴士
      </h4>
      <ol className="space-y-2 text-sm text-stone list-decimal list-inside mb-3">
        <li>至少上传 {minPhotos} 张不同角度的清晰照片</li>
        <li>确保光线充足，避免阴影遮挡面部</li>
        <li>不要佩戴墨镜、口罩等遮挡物</li>
        <li>包含正面、侧面、微笑等多种表情</li>
      </ol>
      <button
        type="button"
        onClick={onOpenGuideModal}
        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
      >
        查看优质照片示例 <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
