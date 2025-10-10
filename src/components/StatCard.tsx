import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color?: 'rose-gold' | 'dusty-rose' | 'navy' | 'forest';
}

const colorClasses = {
  'rose-gold': {
    icon: 'text-rose-gold',
    bg: 'bg-rose-gold/10',
    border: 'border-rose-gold/20'
  },
  'dusty-rose': {
    icon: 'text-dusty-rose',
    bg: 'bg-dusty-rose/10',
    border: 'border-dusty-rose/20'
  },
  navy: {
    icon: 'text-navy',
    bg: 'bg-navy/10',
    border: 'border-navy/20'
  },
  forest: {
    icon: 'text-forest',
    bg: 'bg-forest/10',
    border: 'border-forest/20'
  }
};

export function StatCard({ icon: Icon, label, value, color = 'rose-gold' }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`px-6 py-4 ${colors.bg} backdrop-blur-sm rounded-xl border ${colors.border} transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${colors.icon}`} />
        <div>
          <div className="text-2xl font-display font-semibold text-navy">{value}</div>
          <div className="text-sm text-stone">{label}</div>
        </div>
      </div>
    </div>
  );
}


