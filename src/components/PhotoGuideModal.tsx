import { X, Check, AlertCircle } from 'lucide-react';

interface PhotoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoGuideModal({ isOpen, onClose }: PhotoGuideModalProps) {
  if (!isOpen) return null;

  const goodExamples = [
    {
      title: '清晰正面照',
      description: '光线充足，面部清晰，表情自然',
      tips: ['正面拍摄', '光线均匀', '背景简洁'],
    },
    {
      title: '侧面特写',
      description: '展示面部轮廓，角度适中',
      tips: ['45度侧面', '清晰聚焦', '避免阴影'],
    },
    {
      title: '半身照',
      description: '包含上半身，姿态自然',
      tips: ['距离适中', '姿势放松', '表情丰富'],
    },
  ];

  const badExamples = [
    {
      title: '光线太暗',
      description: '面部细节不清晰',
      issue: '增加光源或选择明亮环境',
    },
    {
      title: '模糊不清',
      description: '对焦不准或抖动',
      issue: '保持稳定，确保清晰对焦',
    },
    {
      title: '遮挡面部',
      description: '帽子、眼镜或头发遮挡',
      issue: '移除遮挡物，完整展示面部',
    },
    {
      title: '角度过偏',
      description: '极端角度或仰俯视',
      issue: '选择平视或微俯视角度',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">照片拍摄指南</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">优质照片示例</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goodExamples.map((example, i) => (
                <div key={i} className="border border-green-200 rounded-xl p-4 bg-green-50">
                  <div className="aspect-[3/4] bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-3 flex items-center justify-center">
                    <Check className="w-12 h-12 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{example.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                  <ul className="space-y-1">
                    {example.tips.map((tip, j) => (
                      <li key={j} className="text-xs text-green-700 flex items-center gap-1">
                        <Check className="w-3 h-3 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">需要避免的情况</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badExamples.map((example, i) => (
                <div key={i} className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200 rounded-lg mb-3 flex items-center justify-center">
                    <X className="w-12 h-12 text-red-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{example.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                  <div className="text-xs text-red-700 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{example.issue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              最佳实践建议
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>数量：</strong>至少上传1张（建议3-5张），包含不同角度和表情</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>分辨率：</strong>每张照片至少800x800像素，推荐1200x1200以上</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>光线：</strong>自然光或柔和的室内光线，避免强烈阴影</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>背景：</strong>简洁的背景更有利于AI识别面部特征</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>表情：</strong>自然微笑、严肃、侧脸等多样化表情</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>角度：</strong>正面、左侧、右侧、45度角各1-2张</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
