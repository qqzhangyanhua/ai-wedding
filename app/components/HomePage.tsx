import { Camera, Sparkles, Zap, Shield, DollarSign, Globe, ArrowRight, Star, Check, Upload, Palette, Heart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { FadeIn } from '@/components/react-bits';

interface HomePageProps {
  onNavigate?: (page: string) => void; // 可选，向后兼容
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      router.push(`/${page === 'home' ? '' : page}`);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('templates');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush">
      {/* Hero Section */}
      <section className="px-4 pt-32 pb-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-10 text-center">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-champagne border border-rose-gold/20 text-navy rounded-full text-sm font-medium tracking-wide shadow-sm">
              <Sparkles className="w-4 h-4 text-rose-gold" />
              AI驱动的婚纱摄影
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="text-4xl font-light tracking-tight leading-tight font-display sm:text-5xl md:text-6xl lg:text-7xl text-stone">
              创造您梦想中的
              <span className="block mt-3 font-medium text-navy">
                绝美婚纱照
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mx-auto space-y-6 max-w-3xl">
              <p className="text-xl font-medium text-navy">用AI创造梦幻婚纱照，让每一刻都值得珍藏</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex gap-3 items-start p-4 rounded-xl border backdrop-blur-sm bg-ivory/50 border-stone/10">
                  <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-full bg-rose-gold/20">
                    <Check className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-navy">全球任意场景</h3>
                    <p className="text-sm text-stone">巴黎、东京、冰岛...想去哪就去哪</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-4 rounded-xl border backdrop-blur-sm bg-ivory/50 border-stone/10">
                  <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-full bg-rose-gold/20">
                    <Check className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-navy">节省数万费用</h3>
                    <p className="text-sm text-stone">只需传统摄影的1/10价格</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-4 rounded-xl border backdrop-blur-sm bg-ivory/50 border-stone/10">
                  <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-full bg-rose-gold/20">
                    <Check className="w-5 h-5 text-rose-gold" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-navy">5分钟即可完成</h3>
                    <p className="text-sm text-stone">上传照片，选择模板，立即生成</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex flex-col gap-4 justify-center items-center sm:flex-row">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-all duration-300 shadow-md hover:shadow-xl font-medium text-lg flex items-center gap-2 hover:-translate-y-0.5"
              >
                <Camera className="w-5 h-5" />
                免费开始创作
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('gallery')}
                className="px-8 py-4 bg-ivory text-navy border border-stone/20 rounded-md hover:bg-champagne hover:border-stone/30 transition-all duration-300 shadow-sm hover:shadow-md font-medium text-lg hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Heart className="w-5 h-5" />
                浏览画廊
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="flex gap-8 justify-center items-center pt-6">
              <div className="flex gap-3 items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-11 h-11 bg-gradient-to-br rounded-full shadow-sm from-champagne to-blush border-3 border-ivory" />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex gap-1 items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-rose-gold text-rose-gold" />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-stone">10,000+ 幸福情侣</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.6}>
          <div className="grid grid-cols-1 gap-6 mt-24 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=400'
            ].map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group cursor-pointer aspect-[3/4] border-2 border-ivory">
                <Image
                  src={url}
                  alt="示例"
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity duration-500 from-navy/70 via-navy/10 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-ivory">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-medium font-display text-navy">为什么选择AI婚纱照？</h2>
            <p className="text-xl text-stone">婚纱摄影的未来已经来临</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: '更快更便宜',
                description: '节省昂贵的摄影、化妆和场地成本,几分钟内生成百张照片。',
                delay: 0.2
              },
              {
                icon: DollarSign,
                title: '成本极低',
                description: '只需几十分之一的价格即可获得媲美专业摄影的效果。',
                delay: 0.3
              },
              {
                icon: Globe,
                title: '随处取景',
                description: '巴黎铁塔、东京樱花、冰岛极光……你想去的地方,都能实现。',
                delay: 0.4
              },
              {
                icon: Shield,
                title: '隐私安全',
                description: '您的照片经过加密,完全隐私。只有您才能访问生成的图像。',
                delay: 0.5
              },
              {
                icon: Camera,
                title: '风格无限',
                description: '尝试奇幻、艺术、经典和现代风格。想创建多少变化就创建多少。',
                delay: 0.6
              }
            ].map((feature, i) => (
              <FadeIn key={i} delay={feature.delay}>
                <div className="p-8 h-full rounded-xl border shadow-sm backdrop-blur-md transition-all duration-300 bg-ivory/50 border-stone/10 hover:shadow-md hover:border-rose-gold/30">
                  <div className="flex justify-center items-center mb-6 w-14 h-14 bg-gradient-to-br rounded-xl border from-rose-gold/20 to-dusty-rose/20 border-rose-gold/20">
                    <feature.icon className="w-7 h-7 text-dusty-rose" />
                  </div>
                  <h3 className="mb-3 text-xl font-medium font-display text-navy">{feature.title}</h3>
                  <p className="leading-relaxed text-stone">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-ivory to-champagne">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-medium font-display text-navy">如何使用</h2>
            <p className="text-xl text-stone">三个简单步骤即可获得惊人照片</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: '上传照片',
                description: '至少上传1张高质量照片（建议3-5张）。AI将学习您的独特面部特征。',
                icon: Upload
              },
              {
                step: '2',
                title: '选择模板',
                description: '浏览我们的精美模板库。挑选您喜爱的场景和风格。',
                icon: Palette
              },
              {
                step: '3',
                title: '下载分享',
                description: '几分钟内获得数百张专业照片。下载并分享您的最爱。',
                icon: Heart
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="space-y-4 text-center">
                  <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-br rounded-xl border from-rose-gold/30 to-dusty-rose/30 border-rose-gold/30">
                    <step.icon className="w-8 h-8 text-dusty-rose" />
                  </div>
                  <div className="inline-flex justify-center items-center mb-4 w-12 h-12 text-xl font-bold bg-gradient-to-br rounded-full shadow-sm from-rose-gold to-dusty-rose text-ivory">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-medium font-display text-navy">{step.title}</h3>
                  <p className="mx-auto max-w-sm leading-relaxed text-stone">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-rose-gold to-dusty-rose opacity-30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-navy via-forest to-navy">
        <div className="px-4 mx-auto max-w-4xl text-center sm:px-6 lg:px-8 text-ivory">
          <h2 className="mb-6 text-4xl font-medium md:text-5xl font-display">准备好创造魔法了吗？</h2>
          <p className="mb-8 text-xl text-stone">加入数千对用AI转化婚纱照的情侣</p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-ivory text-navy rounded-md hover:bg-champagne transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-lg inline-flex items-center gap-2 hover:-translate-y-0.5"
          >
            免费开始
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex flex-wrap gap-6 justify-center items-center mt-6 text-sm text-stone">
            <div className="flex gap-2 items-center">
              <Check className="w-5 h-5 text-rose-gold" />
              无需信用卡
            </div>
            <div className="flex gap-2 items-center">
              <Check className="w-5 h-5 text-rose-gold" />
              50免费积分
            </div>
            <div className="flex gap-2 items-center">
              <Check className="w-5 h-5 text-rose-gold" />
              随时取消
            </div>
          </div>
        </div>
      </section>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
