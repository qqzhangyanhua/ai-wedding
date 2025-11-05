import { useState } from 'react';
import { Template } from '@/types/database';

export function useTemplateSelection() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleTemplateSelect = (template: Template): void => {
    setSelectedTemplate(template);
    setSelectedPromptIndex(0);
    setCustomPrompt('');
  };

  const handleCustomPromptChange = (value: string): void => {
    setCustomPrompt(value);
    if (value.trim() && selectedTemplate) {
      setSelectedTemplate(null);
      setSelectedPromptIndex(0);
    }
  };

  const getCurrentPrompt = (): string => {
    if (selectedTemplate) {
      if (selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0) {
        return selectedTemplate.prompt_list[selectedPromptIndex] || selectedTemplate.prompt_list[0];
      }
      const promptConfig = typeof selectedTemplate.prompt_config === 'string'
        ? JSON.parse(selectedTemplate.prompt_config)
        : selectedTemplate.prompt_config;
      return promptConfig.basePrompt || '';
    }
    return customPrompt.trim();
  };

  return {
    selectedTemplate,
    selectedPromptIndex,
    customPrompt,
    handleTemplateSelect,
    setSelectedPromptIndex,
    handleCustomPromptChange,
    getCurrentPrompt,
  };
}
