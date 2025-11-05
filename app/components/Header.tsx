import { Camera, Sparkles, LogIn, LogOut, User, Menu, X, Github } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { GITHUB_REPO_URL } from '@/lib/constants';

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
      <header className="sticky top-0 z-50 border-b shadow-sm backdrop-blur-md bg-ivory/98 border-stone/10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex gap-8 items-center">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2.5"
              >
                <div className="flex justify-center items-center w-9 h-9 bg-gradient-to-br rounded-lg shadow-sm from-rose-gold to-dusty-rose">
                  <Camera className="w-5 h-5 text-ivory" />
                </div>
                <span className="text-xl font-medium tracking-tight font-display text-navy">
                  AI婚纱照
                </span>
              </button>

              <nav className="hidden gap-8 items-center md:flex">
                <button
                  onClick={() => onNavigate('templates')}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    currentPage === 'templates' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                  }`}
                >
                  模板
                </button>
                <button
                  onClick={() => onNavigate('generate-single')}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    currentPage === 'generate-single' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                  }`}
                >
                  生成单张
                </button>
                <button
                  onClick={() => onNavigate('gallery')}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                    currentPage === 'gallery' ? 'text-dusty-rose' : 'text-stone hover:text-navy'
                  }`}
                >
                  画廊
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

            <div className="hidden gap-4 items-center md:flex">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md transition-all duration-200 text-stone hover:text-navy hover:bg-champagne"
                aria-label="GitHub 仓库"
              >
                <Github className="w-5 h-5" />
              </a>
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-champagne border border-stone/10 rounded-full shadow-sm">
                    <Sparkles className="w-4 h-4 text-rose-gold" />
                    <span className="text-sm font-medium text-navy">{profile?.credits || 0}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex gap-2 items-center px-4 py-2 rounded-md transition-all duration-200 text-stone hover:text-navy hover:bg-champagne"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile?.full_name || '账户'}</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex gap-2 items-center px-4 py-2 rounded-md transition-all duration-200 text-stone hover:text-navy hover:bg-champagne"
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
              className="p-2 transition-colors md:hidden text-stone hover:text-navy"
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t md:hidden border-stone/10 bg-ivory">
            <nav className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  onNavigate('templates');
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
              >
                模板
              </button>
              <button
                onClick={() => {
                  onNavigate('generate-single');
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
              >
                生成单张
              </button>
              <button
                onClick={() => {
                  onNavigate('gallery');
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
              >
                画廊
              </button>
              <button
                onClick={() => {
                  onNavigate('pricing');
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
              >
                价格
              </button>
              <a
                href="/testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
              >
                案例
              </a>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex gap-2 items-center px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
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
                    className="px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-stone hover:text-navy hover:bg-champagne"
                  >
                    我的项目
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 w-full text-sm font-medium text-left rounded-md transition-colors text-destructive hover:bg-destructive/10"
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
                  className="px-4 py-2 w-full font-medium rounded-md transition-colors bg-navy text-ivory hover:bg-navy/90"
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
