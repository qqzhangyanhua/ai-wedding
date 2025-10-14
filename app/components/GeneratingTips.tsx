import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

const tips = [
  '💡 AI正在学习您的独特面部特征，这需要一些时间...',
  '✨ 我们的AI模型已经为超过10,000对情侣生成了梦幻婚纱照',
  '🎨 生成的照片可以无限次重新生成，直到您满意为止',
  '📸 最佳效果：上传不同角度和表情的照片会得到更自然的结果',
  '🌟 平均每次生成需要1-2分钟，请耐心等待',
  '💎 生成的照片分辨率可达4K，适合打印和分享',
  '🎭 我们的AI支持多种艺术风格：浪漫、复古、现代、奇幻',
  '🏖️ 您可以选择任何地点：巴黎、东京、海滩、森林...',
  '🎉 生成完成后，您可以下载无水印的高清版本',
  '⏰ 小贴士：生成期间可以选择后台处理，继续浏览其他内容',
];

interface GeneratingTipsProps {
  visible?: boolean;
}

export function GeneratingTips({ visible = true }: GeneratingTipsProps) {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-pink-50 border border-blue-200 rounded-xl">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-1">趣味小贴士</p>
          <p
            key={currentTip}
            className="text-sm text-gray-700 animate-in fade-in duration-500"
          >
            {tips[currentTip]}
          </p>
        </div>
      </div>
    </div>
  );
}
