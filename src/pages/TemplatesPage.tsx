import { useState } from 'react';
import { Heart, Sparkles, ArrowRight, Search, Loader2 } from 'lucide-react';
import { categoryInfo } from '../data/mockData';
import { Template } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { useTemplates } from '../hooks/useTemplates';
import { useFavorites } from '../hooks/useFavorites';

interface TemplatesPageProps {
  onNavigate: (page: string, template?: Template) => void;
}

export function TemplatesPage({ onNavigate }: TemplatesPageProps) {
  const { user } = useAuth();
  const { templates, loading } = useTemplates();
  const { favorites, toggleFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: Template) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    onNavigate('create', template);
  };

  const categories = [
    { id: 'all', name: '所有模板', icon: '✨' },
    ...Object.entries(categoryInfo).map(([id, info]) => ({
      id,
      name: info.name,
      icon: info.icon
    }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Perfect
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent"> Style</span>
          </h1>
          <p className="text-xl text-gray-600">Browse our collection of stunning wedding photo templates</p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            显示 <span className="font-semibold text-gray-900">{filteredTemplates.length}</span> 个模板
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={template.preview_image_url}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(template.id);
                  }}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.has(template.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-600'
                    }`}
                  />
                </button>

                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full px-4 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
                  >
                    使用此模板
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {template.price_credits} 积分
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {categoryInfo[template.category].name}
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {!loading && filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">未找到模板</h3>
            <p className="text-gray-600">尝试调整搜索或筛选条件</p>
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
