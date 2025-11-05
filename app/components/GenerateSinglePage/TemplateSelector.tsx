import Image from 'next/image';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Template } from '@/types/database';
import { CardSkeleton } from '@/components/ui/card-skeleton';

interface TemplateSelectorProps {
  templates: Template[];
  templatesLoading: boolean;
  selectedTemplate: Template | null;
  selectedPromptIndex: number;
  onTemplateSelect: (template: Template) => void;
  onPromptIndexChange: (index: number) => void;
}

export function TemplateSelector({
  templates,
  templatesLoading,
  selectedTemplate,
  selectedPromptIndex,
  onTemplateSelect,
  onPromptIndexChange,
}: TemplateSelectorProps) {
  return (
    <div className="p-6 mb-8 rounded-xl border shadow-sm bg-ivory border-stone/10">
      <h2 className="mb-4 text-xl font-medium font-display text-navy">选择风格模板（可选）</h2>

      {templatesLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} aspectClass="aspect-[3/4]" lines={1} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {templates.slice(0, 12).map((template) => (
            <div
              key={template.id}
              onClick={() => onTemplateSelect(template)}
              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                selectedTemplate?.id === template.id
                  ? 'border-rose-gold shadow-lg scale-105'
                  : 'border-stone/20 hover:border-rose-gold/50 hover:shadow-md'
              }`}
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={template.preview_image_url}
                  alt={template.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover"
                />
                {selectedTemplate?.id === template.id && (
                  <div className="flex absolute inset-0 justify-center items-center bg-rose-gold/20">
                    <div className="flex justify-center items-center w-10 h-10 rounded-full bg-rose-gold">
                      <CheckCircle className="w-6 h-6 text-ivory" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 bg-ivory">
                <p className="text-xs font-medium truncate text-navy">{template.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTemplate && selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0 && (
        <div className="pt-6 mt-6 border-t border-stone/20">
          <h3 className="flex gap-2 items-center mb-4 text-lg font-medium font-display text-navy">
            <Sparkles className="w-5 h-5 text-rose-gold" />
            选择提示词风格
            <span className="text-sm font-normal text-stone">（{selectedTemplate.prompt_list.length} 个可选）</span>
          </h3>
          <div className="space-y-3">
            {selectedTemplate.prompt_list.map((prompt, index) => (
              <div
                key={index}
                onClick={() => onPromptIndexChange(index)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  selectedPromptIndex === index
                    ? 'border-rose-gold bg-rose-gold/5 shadow-sm'
                    : 'border-stone/20 hover:border-rose-gold/50 hover:bg-champagne/30'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    selectedPromptIndex === index
                      ? 'border-rose-gold bg-rose-gold'
                      : 'border-stone/30'
                  }`}>
                    {selectedPromptIndex === index && (
                      <CheckCircle className="w-4 h-4 text-ivory" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 items-center mb-2">
                      <span className={`text-sm font-medium ${
                        selectedPromptIndex === index ? 'text-rose-gold' : 'text-navy'
                      }`}>
                        风格 {index + 1}
                      </span>
                      {selectedPromptIndex === index && (
                        <span className="px-2 py-0.5 bg-rose-gold/20 text-rose-gold text-xs rounded-full font-medium">
                          已选择
                        </span>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      selectedPromptIndex === index ? 'text-navy' : 'text-stone'
                    }`}>
                      {prompt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
