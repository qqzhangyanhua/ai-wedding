import { Camera, Sparkles, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-ivory/98 backdrop-blur-md border-b border-stone/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2.5"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-rose-gold to-dusty-rose rounded-lg flex items-center justify-center shadow-sm">
                  <Camera className="w-5 h-5 text-ivory" />
                </div>
                <span className="text-xl font-display font-medium text-navy tracking-tight">
                  AI婚纱照
                </span>
              </button>

              <nav className="hidden md:flex items-center gap-8">
                <button
                  onClick={() => onNavigate('templates')}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    currentPage === 'templates' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                  }`}
                >
                  模板
                </button>
                <button
                  onClick={() => onNavigate('pricing')}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    currentPage === 'pricing' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                  }`}
                >
                  价格
                </button>
                <a
                  href="/testimonials"
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    currentPage === 'testimonials' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                  }`}
                >
                  案例
                </a>
                {user && (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                      currentPage === 'dashboard' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                    }`}
                  >
                    我的项目
                  </button>
                )}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-champagne border border-stone/10 rounded-full shadow-sm">
                    <Sparkles className="w-4 h-4 text-rose-gold" />
                    <span className="text-sm font-medium text-navy">{profile?.credits || 0}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 text-stone hover:text-navy hover:bg-champagne rounded-md transition-all duration-200"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile?.full_name || '账户'}</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-stone hover:text-navy hover:bg-champagne rounded-md transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">退出</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  开始使用
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone hover:text-navy transition-colors"
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone/10 bg-ivory">
            <nav className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  onNavigate('templates');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-stone hover:text-navy hover:bg-champagne rounded-md transition-colors"
              >
                模板
              </button>
              <button
                onClick={() => {
                  onNavigate('pricing');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-stone hover:text-navy hover:bg-champagne rounded-md transition-colors"
              >
                价格
              </button>
              <a
                href="/testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm font-medium text-stone hover:text-navy hover:bg-champagne rounded-md transition-colors"
              >
                案例
              </a>
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-champagne border border-stone/10 rounded-full">
                      <Sparkles className="w-4 h-4 text-rose-gold" />
                      <span className="text-sm font-medium text-navy">{profile?.credits || 0} 积分</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-stone hover:text-navy hover:bg-champagne rounded-md transition-colors"
                  >
                    我的项目
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-navy text-ivory rounded-md hover:bg-navy/90 font-medium transition-colors"
                >
                  开始使用
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
