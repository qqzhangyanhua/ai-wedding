import { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.fullName);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-ivory rounded-xl shadow-2xl border border-stone/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone hover:text-navy rounded-md hover:bg-champagne transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-display font-medium text-navy mb-2">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="text-stone mb-6">
            {isLogin ? '登录以访问您的项目' : '开始创作精美婚纱照'}
          </p>

          {/* 第三方登录区域 */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setError('');
                // 使用 Google 登录，回跳到当前页面
                signInWithGoogle().catch((e) => setError(e?.message || '跳转到 Google 登录失败'));
              }}
              className="w-full py-3 bg-white text-navy border border-stone/20 rounded-md hover:bg-champagne transition-all duration-300 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              type="button"
            >
              {/* 简单的 Google G 标识（避免引新依赖） */}
              <span className="inline-block w-5 h-5 rounded-full bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#FBBC05]" />
              使用 Google 登录
            </button>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-stone/20" />
            <span className="text-xs text-stone">或使用邮箱{isLogin ? '登录' : '注册'}</span>
            <div className="flex-1 h-px bg-stone/20" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-navy mb-2">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-stone/20 bg-champagne rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all"
                    placeholder="请输入您的姓名"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-stone/20 bg-champagne rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-stone/20 bg-champagne rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-all duration-300 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  处理中...
                </>
              ) : (
                <>{isLogin ? '登录' : '创建账号'}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-dusty-rose hover:text-dusty-rose/80 font-medium transition-colors"
            >
              {isLogin ? '没有账号？注册' : '已有账号？登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
