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

const SUPABASE_SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const TRANSFORMABLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  const fileType = file.type.toLowerCase();
  if (!TRANSFORMABLE_IMAGE_TYPES.has(fileType)) return file;

  const mustConvertForUpload = !SUPABASE_SUPPORTED_TYPES.has(fileType);
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

  if (!mustConvertForUpload && blob.size >= file.size) return file;

  const baseName = file.name.includes('.')
    ? file.name.replace(/\.[^.]+$/, '')
    : file.name;

  return new File([blob], `${baseName}.jpg`, {
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
        setError('Veuillez selectionner une image');
        return null;
      }

      const requiresNormalization = !SUPABASE_SUPPORTED_TYPES.has(file.type.toLowerCase());
      let processedFile = file;

      try {
        processedFile = await compressImage(file);
      } catch {
        if (requiresNormalization) {
          setError("Ce format d'image n'est pas pris en charge. Utilisez JPG, PNG, WEBP ou GIF.");
          return null;
        }
      }

      if (!SUPABASE_SUPPORTED_TYPES.has(processedFile.type.toLowerCase())) {
        setError("Ce format d'image n'est pas pris en charge. Utilisez JPG, PNG, WEBP ou GIF.");
        return null;
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
          cacheControl: '31536000',
        });

      if (uploadError) {
        const msg =
          uploadError.message.includes('exceeded') || uploadError.message.includes('timeout')
            ? `Telechargement trop long - essayez une image plus petite (< ${MAX_FILE_SIZE_MB} Mo).`
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

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
      }

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
            <div key={url + i} className="flex items-center gap-3 rounded-lg border bg-gray-50 p-2">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-100 sm:h-16 sm:w-16">
                <Image src={url} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-gray-400">
                {url.split('/').pop()}
              </p>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Monter"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Descendre"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Supprimer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
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
        className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:border-orange-400 hover:text-orange-500 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            {progress
              ? `Telechargement ${progress.current}/${progress.total}...`
              : 'Telechargement...'}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
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
        Images compressees automatiquement (max {MAX_DIMENSION}px, {MAX_FILE_SIZE_MB} Mo).
      </p>
    </div>
  );
}
