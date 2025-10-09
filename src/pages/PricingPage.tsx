import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const plans = [
    {
      name: 'Starter',
      price: 19.99,
      credits: 50,
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      features: [
        '50生成积分',
        '5种模板风格',
        'HD高清下载',
        '基础编辑工具',
        '邮件支持',
        '30天有效期'
      ]
    },
    {
      name: 'Popular',
      price: 49.99,
      credits: 150,
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        '150生成积分',
        '所有模板风格',
        '4K超高清下载',
        '高级编辑工具',
        '优先支持',
        '90天有效期',
        '批量处理',
        '自定义去水印'
      ]
    },
    {
      name: 'Premium',
      price: 99.99,
      credits: 400,
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      features: [
        '400生成积分',
        '无限模板',
        '8K顶级下载',
        '专业编辑套件',
        '7x24 VIP支持',
        '终身访问',
        'API接口',
        '商业许可',
        '白牌选项'
      ]
    }
  ];

  const handlePurchase = async (planIndex: number) => {
    if (!user || !profile) {
      setToast({ message: '请先登录', type: 'error' });
      return;
    }

    const plan = plans[planIndex];
    setPurchasing(planIndex);

    try {
      const newCredits = profile.credits + plan.credits;

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();

      setToast({ message: `购买成功！已添加 ${plan.credits} 积分到您的账户`, type: 'success' });
      setPurchasing(null);
    } catch (error) {
      console.error('购买失败:', error);
      setToast({ message: '购买失败，请重试', type: 'error' });
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent"> Perfect Plan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free with 50 credits. Upgrade anytime for more generations and premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-pink-600 text-white text-center py-2 text-sm font-bold">
                  MOST POPULAR
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-6`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">one-time</span>
                </div>

                <div className="mb-6 px-4 py-3 bg-gradient-to-r from-blue-50 to-pink-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Generation Credits</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                      {plan.credits}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(index)}
                  disabled={purchasing !== null}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-pink-600 text-white hover:from-blue-700 hover:to-pink-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {purchasing === index ? '购买中...' : user ? '立即购买' : '开始使用'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-pink-50 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">常见问题</h2>
            <div className="space-y-6 mt-8">
              {[
                {
                  q: '积分如何运作？',
                  a: '每个模板生成根据复杂度需要 10-20 积分。一积分 = 一次AI生成尝试。'
                },
                {
                  q: '可以退款吗？',
                  a: '可以！如果您对结果不满意，我们提供30天退款保证。'
                },
                {
                  q: '积分会过期吗？',
                  a: '积分在您的计划期限内有效（30天、90天或终身）。'
                },
                {
                  q: '可以升级计划吗？',
                  a: '当然！随时升级，您现有的积分将被保留。'
                }
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-xl p-6 text-left shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-6 bg-white rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">10,000+</div>
              <div className="text-sm text-gray-600">幸福情侣</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">500K+</div>
              <div className="text-sm text-gray-600">生成照片</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">客户评分</div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
