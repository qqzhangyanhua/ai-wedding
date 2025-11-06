import { Loader2 } from 'lucide-react';
import { SingleGenerationCard } from '../SingleGenerationCard';
import { EmptyState } from './EmptyState';
import type { SingleGeneration } from '@/types/database';

interface SingleGenerationListProps {
  generations: SingleGeneration[];
  loading: boolean;
  onDelete: (id: string) => void;
  onView: (generation: SingleGeneration) => void;
  onNavigateToGenerateSingle: () => void;
}

export function SingleGenerationList({
  generations,
  loading,
  onDelete,
  onView,
  onNavigateToGenerateSingle,
}: SingleGenerationListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-dusty-rose" />
      </div>
    );
  }

  if (generations.length === 0) {
    return <EmptyState type="single" onAction={onNavigateToGenerateSingle} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {generations.map(generation => (
        <SingleGenerationCard
          key={generation.id}
          generation={generation}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
}

