import { Camera, Sparkles, Zap, Shield, DollarSign, Globe, ArrowRight, Star, Check, Upload, Palette, Heart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      onNavigate('templates');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-pink-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI驱动的婚纱摄影
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            几分钟内创建
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">绝美婚纱照</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            用AI将您的照片转化为令人惊叹的婚纱回忆。无需离家即可前往巴黎、东京或奇幻世界。节省数万元传统摄影费用。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium text-lg flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              免费开始创作
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('templates')}
              className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg font-medium text-lg border border-gray-200"
            >
              浏览模板
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 border-2 border-white" />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">10,000+ 幸福情侣</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=400'
          ].map((url, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group cursor-pointer aspect-[3/4]">
              <Image
                src={url}
                alt="示例"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">为什么选择AI婚纱照？</h2>
            <p className="text-xl text-gray-600">婚纱摄影的未来已经来临</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: '更快更便宜',
                description: '节省昂贵的摄影、化妆和场地成本，几分钟内生成百张照片。',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                icon: DollarSign,
                title: '成本极低',
                description: '只需几十分之一的价格即可获得媲美专业摄影的效果。',
                color: 'from-green-500 to-emerald-600'
              },
              {
                icon: Globe,
                title: '随处取景',
                description: '巴黎铁塔、东京樱花、冰岛极光……你想去的地方，都能实现。',
                color: 'from-cyan-500 to-blue-600'
              },
              {
                icon: Shield,
                title: '隐私安全',
                description: '您的照片经过加密，完全隐私。只有您才能访问生成的图像。',
                color: 'from-red-500 to-pink-600'
              },
              {
                icon: Camera,
                title: '风格无限',
                description: '尝试奇幻、艺术、经典和现代风格。想创建多少变化就创建多少。',
                color: 'from-indigo-500 to-purple-600'
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">如何使用</h2>
            <p className="text-xl text-gray-600">三个简单步骤即可获得惊人照片</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: '上传照片',
                description: '上传5-10张高质量照片。AI将学习您的独特面部特征。',
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
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-pink-600 text-white rounded-full font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-pink-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-r from-blue-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">准备好创造魔法了吗？</h2>
          <p className="text-xl mb-8 opacity-90">加入数千对用AI转化婚纱照的情侣</p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-bold text-lg inline-flex items-center gap-2"
          >
            免费开始
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              无需信用卡
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              50免费积分
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              随时取消
            </div>
          </div>
        </div>
      </section>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
