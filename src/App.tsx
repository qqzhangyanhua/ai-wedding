import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { TemplatesPage } from './pages/TemplatesPage';
import { CreatePage } from './pages/CreatePage';
import { ResultsPage } from './pages/ResultsPage';
import { PricingPage } from './pages/PricingPage';
import { DashboardPage } from './pages/DashboardPage';
import { Template } from './types/database';

type Page = 'home' | 'templates' | 'create' | 'results' | 'pricing' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>();
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | undefined>();

  const handleNavigate = (page: string, template?: Template, generationId?: string) => {
    setCurrentPage(page as Page);
    if (template) {
      setSelectedTemplate(template);
    }
    if (generationId) {
      setSelectedGenerationId(generationId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigate} currentPage={currentPage} />

        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'templates' && <TemplatesPage onNavigate={handleNavigate} />}
        {currentPage === 'create' && <CreatePage onNavigate={handleNavigate} selectedTemplate={selectedTemplate} />}
        {currentPage === 'results' && <ResultsPage onNavigate={handleNavigate} generationId={selectedGenerationId} />}
        {currentPage === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}

        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-xl font-bold mb-4">AI婚纱照</h3>
                <p className="text-gray-400 mb-4">
                  用AI驱动的照片生成将您的婚纱梦想变为现实。创造精彩回忆，无需传统成本。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">产品</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={() => handleNavigate('templates')} className="hover:text-white transition-colors">模板</button></li>
                  <li><button onClick={() => handleNavigate('pricing')} className="hover:text-white transition-colors">价格</button></li>
                  <li><button onClick={() => handleNavigate('dashboard')} className="hover:text-white transition-colors">仪表盘</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">公司</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">关于</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">博客</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">联系</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">隐私</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 AI婚纱照. 保留所有权利。</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
