import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';
import { FadeIn, GlassCard } from '@/components/react-bits';

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
      onNavigate('home');
      return;
    }

    const plan = plans[planIndex];
    setPurchasing(planIndex);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan: plan.name }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson?.error || '创建订单失败');

      const payment_intent_id: string | undefined = createJson?.payment_intent_id;
      const checkout_url: string | undefined = createJson?.checkout_url;
      if (!payment_intent_id && !checkout_url) throw new Error('缺少支付信息');

      if (checkout_url) {
        window.location.href = checkout_url;
        return;
      } else {
        const confirmRes = await fetch('/api/orders/mock/confirm', {
          method: 'POST',
          headers,
          body: JSON.stringify({ payment_intent_id }),
        });
        const confirmJson = await confirmRes.json();
        if (!confirmRes.ok) throw new Error(confirmJson?.error || '确认支付失败');
      }

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
    <div className="min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn delay={0.1}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-champagne border border-rose-gold/20 text-navy rounded-full text-sm font-medium tracking-wide shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-rose-gold" />
              简单透明的定价
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-navy mb-4">
              选择您完美的
              <span className="text-dusty-rose"> 套餐</span>
            </h1>
            <p className="text-xl text-stone max-w-2xl mx-auto leading-relaxed">
              免费获得50积分开始。随时升级以获得更多生成次数和高级功能。
            </p>
          </div>
        </FadeIn>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <FadeIn key={index} delay={0.2 + index * 0.1}>
              <div
                className={`relative bg-ivory rounded-xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                  plan.popular ? 'border-2 border-rose-gold/30' : 'border border-stone/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory text-center py-2.5 text-sm font-medium tracking-wider uppercase">
                    最受欢迎
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? 'pt-14' : ''}`}>
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-gold/20 to-dusty-rose/20 border border-rose-gold/20 rounded-xl flex items-center justify-center mb-6">
                    <plan.icon className="w-7 h-7 text-dusty-rose" />
                  </div>

                  <h3 className="text-2xl font-display font-medium text-navy mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-display font-semibold text-navy">${plan.price}</span>
                    <span className="text-stone">一次性付费</span>
                  </div>

                  <div className="mb-6 px-4 py-3 bg-gradient-to-r from-champagne to-blush rounded-lg border border-rose-gold/10">
                    <div className="flex items-center justify-between">
                      <span className="text-navy font-medium">生成积分</span>
                      <span className="text-2xl font-display font-semibold text-dusty-rose">
                        {plan.credits}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-rose-gold" />
                        </div>
                        <span className="text-stone leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(index)}
                    disabled={purchasing !== null}
                    className={`w-full py-4 rounded-md font-medium text-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular
                        ? 'bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory hover:shadow-glow'
                        : 'bg-champagne text-navy hover:bg-champagne/80 border border-stone/10'
                    }`}
                  >
                    {purchasing === index ? '购买中...' : user ? '立即购买' : '开始使用'}
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* FAQ Section */}
        <FadeIn delay={0.6}>
          <GlassCard className="max-w-4xl mx-auto">
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-medium text-navy mb-4">常见问题</h2>
                <p className="text-stone">了解更多关于我们的定价和服务</p>
              </div>

              <div className="space-y-6">
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
                  <div key={i} className="bg-ivory/50 backdrop-blur-sm rounded-lg p-6 border border-stone/10 hover:border-rose-gold/20 transition-colors">
                    <h3 className="font-display font-medium text-navy mb-2">{faq.q}</h3>
                    <p className="text-stone leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </FadeIn>
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
