"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadFieldProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
}

export function ImageUploadField({ currentUrl, onUrlChange }: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/admin/upload-template-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传失败');
      }

      const data = await response.json();
      onUrlChange(data.url);
    } catch (error) {
      console.error('上传出错:', error);
      setUploadError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onUrlChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        预览图片 <span className="text-red-500">*</span>
      </Label>

      {currentUrl ? (
        <div className="relative w-full max-w-md">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={currentUrl}
              alt="预览图"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="image-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                上传图片
              </>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            或在下方粘贴图片链接
          </span>
        </div>
      )}

      <Input
        type="url"
        value={currentUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
        disabled={isUploading}
      />

      {uploadError && (
        <p className="text-sm text-red-500">{uploadError}</p>
      )}
    </div>
  );
}
