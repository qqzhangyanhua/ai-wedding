import { Camera, Sparkles, Plus, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  type: 'projects' | 'single';
  onAction: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = type === 'projects' ? {
    icon: Camera,
    title: '还没有项目',
    description: '开始用AI创作惊艳的婚纱照',
    buttonText: '创建您的第一个项目',
  } : {
    icon: Sparkles,
    title: '还没有单张生成记录',
    description: '使用单张生成功能快速创作精美图片',
    buttonText: '开始单张生成',
  };

  const Icon = config.icon;

  return (
    <div className="p-12 text-center">
      <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-champagne">
        <Icon className="w-10 h-10 text-stone" />
      </div>
      <h3 className="mb-2 text-xl font-medium font-display text-navy">{config.title}</h3>
      <p className="mb-6 text-stone">{config.description}</p>
      <button
        onClick={onAction}
        className="inline-flex gap-2 items-center px-6 py-3 font-medium bg-gradient-to-r rounded-md shadow-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-glow"
      >
        <Plus className="w-5 h-5" />
        {config.buttonText}
      </button>
    </div>
  );
}

