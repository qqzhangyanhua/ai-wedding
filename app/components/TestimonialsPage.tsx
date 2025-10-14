import Image from 'next/image';
import { FadeIn, GlassCard } from '@/components/react-bits';

interface TestimonialsPageProps {
  onNavigate: (page: string) => void;
}

export function TestimonialsPage({ onNavigate }: TestimonialsPageProps) {
  const testimonials = [
    {
      name: '小黎 & 阿杰',
      quote: '在家就能完成的婚纱照，效果完全超出预期！朋友都不敢相信是AI做的。',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      name: 'Mona',
      quote: '拍摄建议很有用，三张自拍就合成了超梦幻的成片，太省心了。',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      name: 'Frank',
      quote: '传统婚纱摄影的补充方案，先用AI风格挑选，线下再复刻同风格，效率翻倍。',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ];

  const cases = [
    {
      title: '巴黎经典 · 日落金光',
      cover: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      title: '圣托里尼 · 纯白蓝海',
      cover: 'https://images.pexels.com/photos/161764/santorini-travel-holiday-vacation-161764.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      title: '樱花物语 · 春日庭院',
      cover: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      title: '极光之下 · 冰岛秘境',
      cover: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn delay={0.1}>
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-display font-medium text-navy">用户评价与案例</h1>
            <p className="text-stone mt-3">真实反馈与风格展示，帮你快速找到心动灵感</p>
          </div>
        </FadeIn>

        {/* 用户评价 */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {testimonials.map((t, i) => (
              <GlassCard key={i}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Image src={t.avatar} alt={t.name} width={40} height={40} className="rounded-full object-cover" />
                    <div className="text-navy font-medium">{t.name}</div>
                  </div>
                  <p className="text-stone leading-relaxed">“{t.quote}”</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>

        {/* 案例网格 */}
        <FadeIn delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cases.map((c, i) => (
              <GlassCard key={i} className="overflow-hidden">
                <div className="relative aspect-[4/5]">
                  <Image src={c.cover} alt={c.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="p-4">
                  <div className="text-navy font-medium">{c.title}</div>
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('templates')}
              className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-lg hover:shadow-glow transition-all font-medium"
            >
              立即选择风格，开始创作
            </button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

