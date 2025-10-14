/**
 * 图片生成状态机类型定义
 * 使用判别联合类型确保类型安全
 */

export type GenerationStage = 'uploading' | 'analyzing' | 'generating' | 'completed';

export interface SavedGenerationState {
  photos: string[];
  projectName: string;
  shareToGallery?: boolean;
}

// 状态机：使用判别联合类型（只保留 idle/processing/completed/failed）
export type GenerationState =
  | { status: 'idle' }
  | {
      status: 'processing';
      stage: GenerationStage;
      progress: number;
    }
  | {
      status: 'completed';
      images: string[];
      generationId: string | null;
    }
  | {
      status: 'failed';
      error: string;
      savedState: SavedGenerationState;
    };

// 状态转换动作（移除 SEND_TO_BACKGROUND）
export type GenerationAction =
  | { type: 'START_GENERATION'; savedState: SavedGenerationState }
  | { type: 'UPDATE_PROGRESS'; stage: GenerationStage; progress: number }
  | { type: 'COMPLETE'; images: string[]; generationId: string | null }
  | { type: 'FAIL'; error: string }
  | { type: 'RESET' };

/**
 * 状态机 reducer - 确保所有状态转换都是明确的
 */
export function generationReducer(
  state: GenerationState,
  action: GenerationAction
): GenerationState {
  switch (action.type) {
    case 'START_GENERATION':
      return {
        status: 'processing',
        stage: 'uploading',
        progress: 0,
      };

    case 'UPDATE_PROGRESS':
      if (state.status !== 'processing') return state;
      return {
        ...state,
        stage: action.stage,
        progress: action.progress,
      };

    case 'COMPLETE':
      return {
        status: 'completed',
        images: action.images,
        generationId: action.generationId,
      };

    case 'FAIL':
      if (state.status !== 'processing') return state;
      // 从 processing 状态提取 savedState（需要从外部传入）
      return {
        status: 'failed',
        error: action.error,
        savedState: { photos: [], projectName: '' }, // 将在 hook 中正确处理
      };

    case 'RESET':
      return { status: 'idle' };

    default:
      return state;
  }
}

// 生成服务通用输入/进度/结果类型（供 lib 使用）
import type { Template } from '@/types/database';

export interface GenerationInput {
  photos: string[];
  projectName: string;
  template: Template;
  shareToGallery?: boolean;
}

export interface GenerationProgress {
  stage: 'uploading' | 'analyzing' | 'generating' | 'completed';
  progress: number;
}

export interface GenerationResult {
  images: string[];
  generationId: string | null;
}
