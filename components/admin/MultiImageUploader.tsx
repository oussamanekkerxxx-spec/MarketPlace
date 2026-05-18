'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { X, ArrowUp, ArrowDown, Plus } from 'lucide-react';

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  // Only compress raster formats; skip SVG/GIF
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!blob) return file;

  // Only use compressed version if it's actually smaller
  if (blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export function MultiImageUploader({
  value,
  onChange,
  bucket = 'product-images',
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return null;
      }

      let processedFile = file;
      try {
        processedFile = await compressImage(file);
      } catch {
        // If compression fails, fall back to original — size check below will catch oversized files
      }

      if (processedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `L'image "${file.name}" est trop volumineuse (${(processedFile.size / 1024 / 1024).toFixed(1)} Mo). Maximum: ${MAX_FILE_SIZE_MB} Mo.`
        );
        return null;
      }

      const supabase = createClient();
      const ext = processedFile.name.split('.').pop() || 'jpg';
      const fileName = `detail-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          upsert: false,
          contentType: processedFile.type,
          // Filename includes a timestamp so old URLs never collide with new ones.
          // Safe to cache for a year on browsers + CDN.
          cacheControl: '31536000',
        });

      if (uploadError) {
        const msg =
          uploadError.message.includes('exceeded') || uploadError.message.includes('timeout')
            ? `Téléchargement trop long — essayez une image plus petite (< ${MAX_FILE_SIZE_MB} Mo).`
            : uploadError.message;
        setError(msg);
        return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    },
    [bucket]
  );

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      setUploading(true);
      setError('');
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress({ current: i + 1, total: files.length });
        const url = await uploadFile(files[i]);
        if (url) newUrls.push(url);
      }
      if (newUrls.length > 0) onChange([...value, ...newUrls]);
      setUploading(false);
      setProgress(null);
      e.target.value = '';
    },
    [uploadFile, onChange, value]
  );

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...value];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((url, i) => (
            <div key={url + i} className="flex items-center gap-3 p-2 border rounded-lg bg-gray-50">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden shrink-0 bg-gray-100">
                <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <p className="flex-1 min-w-0 text-xs text-gray-400 truncate">
                {url.split('/').pop()}
              </p>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Monter"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Descendre"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Supprimer"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            {progress
              ? `Téléchargement ${progress.current}/${progress.total}...`
              : 'Téléchargement...'}
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Ajouter une photo
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400">
        Images compressées automatiquement (max {MAX_DIMENSION}px, {MAX_FILE_SIZE_MB} Mo).
      </p>
    </div>
  );
}
