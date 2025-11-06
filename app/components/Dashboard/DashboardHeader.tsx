import { Sparkles, Heart, Download, CheckCircle } from 'lucide-react';
import { FadeIn } from '@/components/react-bits';
import { StatCard } from '../StatCard';
import type { Profile, ProjectWithTemplate } from '@/types/database';

interface DashboardHeaderProps {
  profile: Profile | null;
  projects: ProjectWithTemplate[];
  likes: number;
  downloads: number;
  onNavigateToPricing: () => void;
}

export function DashboardHeader({
  profile,
  projects,
  likes,
  downloads,
  onNavigateToPricing,
}: DashboardHeaderProps) {
  const completedCount = projects.filter(p => p.generation?.status === 'completed').length;

  return (
    <FadeIn delay={0.1}>
      <div className="mb-8 space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-medium font-display text-navy">
            欢迎回来，{profile?.full_name || '亲'}！
          </h1>
          <p className="text-stone">管理您的婚纱照项目和生成作品</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Sparkles}
            label="剩余积分"
            value={profile?.credits || 0}
            color="rose-gold"
          />
          <StatCard icon={Heart} label="累计收藏" value={likes} color="dusty-rose" />
          <StatCard icon={Download} label="累计下载" value={downloads} color="navy" />
          <StatCard
            icon={CheckCircle}
            label="完成项目"
            value={completedCount}
            color="forest"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={onNavigateToPricing}
            className="px-6 py-3 font-medium bg-gradient-to-r rounded-lg shadow-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-glow"
            aria-label="前往价格页面购买积分"
          >
            购买更多积分
          </button>
        </div>
      </div>
    </FadeIn>
  );
}

