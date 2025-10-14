import { useState } from 'react';
import { Upload } from 'lucide-react';

interface PhotoUploadZoneProps {
  onFileSelect: (files: FileList | null) => void;
}

export function PhotoUploadZone({ onFileSelect }: PhotoUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onFileSelect(e.dataTransfer.files);
  };

  return (
    <label
      className={`aspect-square border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className="w-8 h-8 text-gray-400" />
      <span className="text-sm text-gray-500 font-medium text-center px-2">
        {isDragOver ? '释放添加' : '添加照片'}
      </span>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFileSelect(e.target.files)}
        className="hidden"
      />
    </label>
  );
}
