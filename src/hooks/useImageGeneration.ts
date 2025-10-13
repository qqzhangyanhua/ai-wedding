/**
 * 图片生成 Hook - 统一管理生成流程
 *
 * 用状态机替代 17 个独立状态
 */

import { useReducer, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Template } from '../types/database';
import {
  GenerationState,
  GenerationAction,
  generationReducer,
  SavedGenerationState,
} from '../types/generation';
import {
  generateAsGuest,
  generateAsAuthenticated,
  markGenerationFailed,
  GenerationInput,
} from '../lib/generation-service';

interface UseImageGenerationOptions {
  template?: Template;
  allowBackground?: boolean;
}

export function useImageGeneration(options: UseImageGenerationOptions) {
  const { profile, refreshProfile } = useAuth();
  const [state, dispatch] = useReducer(generationReducer, { status: 'idle' });

  // 保存的状态，用于重试
  const savedStateRef = useRef<SavedGenerationState | null>(null);
  const currentGenerationIdRef = useRef<string | null>(null);

  /**
   * 开始生成
   */
  const startGeneration = useCallback(
    async (photos: string[], projectName: string) => {
      if (!options.template) {
        throw new Error('未选择模板');
      }

      if (photos.length < 1 || !projectName.trim()) {
        throw new Error('请上传照片并填写项目名称');
      }

      // 保存状态用于重试
      const savedState: SavedGenerationState = { photos, projectName };
      savedStateRef.current = savedState;

      dispatch({ type: 'START_GENERATION', savedState });

      const input: GenerationInput = {
        photos,
        projectName,
        template: options.template,
      };

      try {
        let result;

        if (!profile) {
          // 游客模式
          result = await generateAsGuest(input, (progress) => {
            dispatch({
              type: 'UPDATE_PROGRESS',
              stage: progress.stage,
              progress: progress.progress,
            });
          });
        } else {
          // 认证模式
          result = await generateAsAuthenticated(
            input,
            profile.id,
            (progress) => {
              dispatch({
                type: 'UPDATE_PROGRESS',
                stage: progress.stage,
                progress: progress.progress,
              });
            }
          );

          // 刷新用户积分
          await refreshProfile();

          // 保存 generationId
          if (result.generationId) {
            currentGenerationIdRef.current = result.generationId;
          }
        }

        // 判断是否后台生成
        if (options.allowBackground && result.generationId) {
          dispatch({
            type: 'SEND_TO_BACKGROUND',
            generationId: result.generationId,
          });
        } else {
          dispatch({
            type: 'COMPLETE',
            images: result.images,
            generationId: result.generationId,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '生成失败';

        // 如果有 generationId，标记为失败
        if (currentGenerationIdRef.current) {
          await markGenerationFailed(
            currentGenerationIdRef.current,
            errorMessage
          );
        }

        // 更新状态为失败（需要改进 reducer 以保留 savedState）
        dispatch({ type: 'FAIL', error: errorMessage });

        throw error;
      }
    },
    [options.template, options.allowBackground, profile, refreshProfile]
  );

  /**
   * 重试生成
   */
  const retry = useCallback(async () => {
    if (!savedStateRef.current) {
      throw new Error('没有可重试的状态');
    }

    const { photos, projectName } = savedStateRef.current;
    await startGeneration(photos, projectName);
  }, [startGeneration]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    savedStateRef.current = null;
    currentGenerationIdRef.current = null;
  }, []);

  /**
   * 检查是否可以生成
   */
  const canGenerate = useCallback(
    (photos: string[], projectName: string): boolean => {
      if (photos.length < 1 || !projectName.trim()) {
        return false;
      }

      if (!options.template) {
        return false;
      }

      // 游客模式：允许试用
      if (!profile) {
        return true;
      }

      // 登录模式：检查积分
      return profile.credits >= options.template.price_credits;
    },
    [profile, options.template]
  );

  return {
    state,
    startGeneration,
    retry,
    reset,
    canGenerate,
    savedState: savedStateRef.current,
  };
}
