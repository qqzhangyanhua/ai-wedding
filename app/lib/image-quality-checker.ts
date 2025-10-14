import type { QualityResult } from '@/types/image';

export async function checkImageQuality(dataUrl: string): Promise<QualityResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const result: QualityResult = {
          score: 0,
          status: 'excellent',
          issues: [],
          checks: {
            resolution: checkResolution(img.width, img.height),
            sharpness: checkSharpness(ctx, img.width, img.height),
            brightness: checkBrightness(ctx, img.width, img.height),
          },
        };

        let totalScore = 0;
        let weights = 0;

        if (result.checks.resolution.passed) {
          totalScore += 100 * 0.3;
        } else {
          result.issues.push('分辨率过低');
          totalScore += 50 * 0.3;
        }
        weights += 0.3;

        if (result.checks.sharpness.passed) {
          totalScore += result.checks.sharpness.score * 0.4;
        } else {
          result.issues.push('图片模糊');
          totalScore += result.checks.sharpness.score * 0.4;
        }
        weights += 0.4;

        if (result.checks.brightness.passed) {
          totalScore += result.checks.brightness.score * 0.3;
        } else {
          result.issues.push(result.checks.brightness.score < 40 ? '光线太暗' : '光线太亮');
          totalScore += result.checks.brightness.score * 0.3;
        }
        weights += 0.3;

        result.score = Math.round(totalScore / weights);

        if (result.score >= 80) {
          result.status = 'excellent';
        } else if (result.score >= 60) {
          result.status = 'good';
        } else {
          result.status = 'poor';
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function checkResolution(width: number, height: number): { passed: boolean; width: number; height: number } {
  const minDimension = 800;
  const passed = width >= minDimension && height >= minDimension;
  return { passed, width, height };
}

function checkSharpness(ctx: CanvasRenderingContext2D, width: number, height: number): { passed: boolean; score: number } {
  const sampleSize = Math.min(width, height, 200);
  const x = Math.floor((width - sampleSize) / 2);
  const y = Math.floor((height - sampleSize) / 2);

  const imageData = ctx.getImageData(x, y, sampleSize, sampleSize);
  const data = imageData.data;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < sampleSize - 1; i++) {
    for (let j = 0; j < sampleSize - 1; j++) {
      const idx = (i * sampleSize + j) * 4;
      const idxRight = (i * sampleSize + j + 1) * 4;
      const idxDown = ((i + 1) * sampleSize + j) * 4;

      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const grayRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
      const grayDown = 0.299 * data[idxDown] + 0.587 * data[idxDown + 1] + 0.114 * data[idxDown + 2];

      const gx = Math.abs(grayRight - gray);
      const gy = Math.abs(grayDown - gray);
      const gradient = Math.sqrt(gx * gx + gy * gy);

      sum += gradient;
      count++;
    }
  }

  const avgGradient = sum / count;
  const normalizedScore = Math.min(100, (avgGradient / 30) * 100);
  const passed = normalizedScore >= 40;

  return { passed, score: Math.round(normalizedScore) };
}

function checkBrightness(ctx: CanvasRenderingContext2D, width: number, height: number): { passed: boolean; score: number } {
  const sampleSize = Math.min(width, height, 100);
  const x = Math.floor((width - sampleSize) / 2);
  const y = Math.floor((height - sampleSize) / 2);

  const imageData = ctx.getImageData(x, y, sampleSize, sampleSize);
  const data = imageData.data;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += brightness;
  }

  const avgBrightness = sum / (data.length / 4);
  const normalizedScore = (avgBrightness / 255) * 100;
  const passed = normalizedScore >= 40 && normalizedScore <= 85;

  return { passed, score: Math.round(normalizedScore) };
}
