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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent"
              >
                <Camera className="w-7 h-7 text-blue-600" />
                AI Wedding Photos
              </button>

              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => onNavigate('templates')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'templates' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  模板
                </button>
                <button
                  onClick={() => onNavigate('pricing')}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'pricing' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  价格
                </button>
                {user && (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`text-sm font-medium transition-colors ${
                      currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{profile?.credits || 0} 积分</span>
                  </div>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile?.full_name || '账户'}</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">退出</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium">开始使用</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  onNavigate('templates');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                模板
              </button>
              <button
                onClick={() => {
                  onNavigate('pricing');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                价格
              </button>
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{profile?.credits || 0} 积分</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    我的项目
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
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
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
