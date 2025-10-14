import { useState } from 'react';
import Image from 'next/image';
import { Heart, Sparkles, ArrowRight, Search } from 'lucide-react';
import { categoryInfo } from '@/data/mockData';
import { Template } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useTemplates } from '@/hooks/useTemplates';
//
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { useFavorites } from '@/hooks/useFavorites';

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
    { id: 'all', name: '所有模板', icon: Sparkles },
    ...Object.entries(categoryInfo).map(([id, info]) => ({
      id,
      name: info.name,
      icon: info.icon
    }))
  ];

  return (
    <div className="min-h-screen bg-champagne py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-medium text-navy mb-4">
            选择您完美的
            <span className="text-dusty-rose"> 风格</span>
          </h1>
          <p className="text-xl text-stone">浏览我们令人惊叹的婚纱照模板集合</p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-stone/20 bg-ivory rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory shadow-md'
                    : 'bg-ivory text-navy hover:bg-champagne border border-stone/10'
                }`}
              >
                {typeof category.icon === 'string' ? (
                  <span className="text-base">{category.icon}</span>
                ) : (
                  <category.icon className="w-4 h-4" />
                )}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-stone">
            显示 <span className="font-semibold text-navy">{filteredTemplates.length}</span> 个模板
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} aspectClass="aspect-[3/4]" lines={2} showBadge />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="group bg-ivory rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-stone/10"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={template.preview_image_url}
                  alt={template.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(template.id);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-ivory/95 backdrop-blur-sm rounded-full hover:bg-ivory flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                  aria-label={favorites.has(template.id) ? '取消收藏' : '收藏模板'}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.has(template.id)
                        ? 'fill-dusty-rose text-dusty-rose'
                        : 'text-navy'
                    }`}
                  />
                </button>

                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full px-4 py-3 bg-ivory text-navy rounded-md hover:bg-champagne transition-colors shadow-lg font-medium flex items-center justify-center gap-2"
                  >
                    使用此模板
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute top-4 left-4 px-3 py-1.5 bg-ivory/95 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-rose-gold" />
                  <span className="text-sm font-medium text-navy">{template.price_credits}</span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-display font-medium text-navy mb-2 group-hover:text-dusty-rose transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-stone line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone/70 uppercase tracking-wider">
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
            <div className="w-16 h-16 bg-champagne rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-stone" />
            </div>
            <h3 className="text-2xl font-display font-medium text-navy mb-2">未找到模板</h3>
            <p className="text-stone">尝试调整搜索或筛选条件</p>
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
