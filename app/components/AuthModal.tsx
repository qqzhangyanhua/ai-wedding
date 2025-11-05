import { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Toast } from './Toast';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
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
        onClose();
      } else {
        await signUp(formData.email, formData.password, formData.fullName);
        // 注册成功后显示提醒消息
        setShowSuccessToast(true);
        // 3秒后关闭弹窗
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccessToast && (
        <Toast
          message="注册成功！请查看您的邮箱并点击确认链接来激活账号。"
          type="success"
          onClose={() => setShowSuccessToast(false)}
          duration={3000}
        />
      )}
      
      <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-navy/50">
        <div className="relative w-full max-w-md rounded-xl border shadow-2xl bg-ivory border-stone/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="mb-2 text-3xl font-medium font-display text-navy">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h2>
          <p className="mb-6 text-stone">
            {isLogin ? '登录以访问您的项目' : '开始创作精美婚纱照'}
          </p>
          {/* 第三方登录区域 */}
          <div className="space-y-3">
            {/* <button
              onClick={() => {
                setError('');
                signInWithGoogle().catch((e) => setError(e?.message || '跳转到 Google 登录失败'));
              }}
              className="flex gap-2 justify-center items-center py-3 w-full font-medium bg-white rounded-md border shadow-sm transition-all duration-300 text-navy border-stone/20 hover:bg-champagne hover:shadow-md"
              type="button"
            >
              <span className="inline-block w-5 h-5 rounded-full bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#FBBC05]" />
              使用 Google 登录(暂时无效)
            </button> */}
          </div>

          <div className="flex gap-4 items-center my-6">
            <div className="flex-1 h-px bg-stone/20" />
            <span className="text-xs text-stone">或使用邮箱{isLogin ? '登录' : '注册'}</span>
            <div className="flex-1 h-px bg-stone/20" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block mb-2 text-sm font-medium text-navy">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-stone" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="py-3 pr-4 pl-11 w-full rounded-md border transition-all border-stone/20 bg-champagne focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
                    placeholder="请输入您的姓名"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-navy">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-stone" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="py-3 pr-4 pl-11 w-full rounded-md border transition-all border-stone/20 bg-champagne focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-navy">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-stone" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="py-3 pr-4 pl-11 w-full rounded-md border transition-all border-stone/20 bg-champagne focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md border bg-destructive/10 border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex gap-2 justify-center items-center py-3 w-full font-medium rounded-md shadow-md transition-all duration-300 bg-navy text-ivory hover:bg-navy/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-sm font-medium transition-colors text-dusty-rose hover:text-dusty-rose/80"
            >
              {isLogin ? '没有账号？注册' : '已有账号？登录'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
