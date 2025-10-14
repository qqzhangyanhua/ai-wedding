import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Image from 'next/image';
import { ProjectWithTemplate } from '@/types/database';
import { GlassCard } from '@/components/react-bits';

interface ProjectEditModalProps {
  project: ProjectWithTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Partial<ProjectWithTemplate>) => Promise<void>;
}

export function ProjectEditModal({
  project,
  isOpen,
  onClose,
  onSave,
}: ProjectEditModalProps) {
  const [projectName, setProjectName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // 重置表单数据当项目改变时
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setError(null);
    }
  }, [project]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('项目名称不能为空');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updatedData: Partial<ProjectWithTemplate> = {
        name: projectName.trim(),
      };

      await onSave(updatedData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // 重置表单
    setProjectName(project.name);
    setError(null);
    onClose();
  };

  // 仅允许修改项目名称
  const isChanged = projectName !== project.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <GlassCard className="m-4">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-stone/10">
            <div>
              <h2 className="text-2xl font-display font-medium text-navy mb-1">
                编辑项目
              </h2>
              <p className="text-stone">目前仅支持修改项目名称</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-stone/10 transition-colors"
              aria-label="关闭"
            >
              <X className="w-6 h-6 text-stone" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-8">
              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* 项目名称 */}
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  项目名称 *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例如：我们的梦幻婚纱照"
                  className="w-full px-4 py-3 border border-stone/20 bg-champagne rounded-md focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all"
                  disabled={saving}
                />
              </div>

              {/* 模板信息（只读） */}
              {project.template && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-4">当前模板（只读）</label>
                  <div className="flex items-center gap-4 p-4 bg-champagne rounded-lg border border-stone/10">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={project.template.preview_image_url}
                        alt={project.template.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-navy">{project.template.name}</h4>
                      <p className="text-sm text-stone">如需更换模板或照片，请新建项目</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-stone/10">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 border border-stone/20 text-stone rounded-md hover:bg-stone/5 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isChanged}
              className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存更改
                </>
              )}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
