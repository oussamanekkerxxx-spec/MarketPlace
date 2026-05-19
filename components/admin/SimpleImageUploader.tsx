'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface SimpleImageUploaderProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const SUPABASE_SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const TRANSFORMABLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const ALWAYS_CONVERT_TYPES = new Set([
  'image/avif',
  'image/heic',
  'image/heif',
]);

async function normalizeUploadImage(file: File): Promise<File> {
  const fileType = file.type.toLowerCase();
  const mustConvert = ALWAYS_CONVERT_TYPES.has(fileType);
  if ((SUPABASE_SUPPORTED_TYPES.has(fileType) && !mustConvert) || !TRANSFORMABLE_IMAGE_TYPES.has(fileType)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (mustConvert) throw new Error('Conversion canvas indisponible');
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) {
    if (mustConvert) throw new Error('Conversion PNG echouee');
    return file;
  }

  const baseName = file.name.includes('.')
    ? file.name.replace(/\.[^.]+$/, '')
    : file.name;

  return new File([blob], `${baseName}.png`, {
    type: 'image/png',
    lastModified: Date.now(),
  });
}

export function SimpleImageUploader({ bucket, value, onChange, label }: SimpleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      setUploading(true);
      setError('');

      try {
        const uploadFile = await normalizeUploadImage(file);
        if (!SUPABASE_SUPPORTED_TYPES.has(uploadFile.type.toLowerCase())) {
          setError("Ce format d'image n'est pas pris en charge. Utilisez JPG, PNG, WEBP, GIF, SVG ou ICO.");
          return;
        }

        const supabase = createClient();
        const ext = uploadFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, uploadFile, {
            upsert: false,
            contentType: uploadFile.type || 'image/png',
            cacheControl: '31536000',
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          setError(`${uploadError.message} (${uploadError.name || 'unknown'})`);
          setUploading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        onChange(publicUrlData.publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de téléchargement');
      } finally {
        setUploading(false);
      }
    },
    [bucket, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  if (value) {
    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
          <Image src={value} alt="Preview" fill sizes="128px" className="object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 transition-colors"
      >
        <div className="text-gray-400 text-sm">
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Téléchargement...
            </span>
          ) : (
            <>
              <span className="block mb-1">📷 Glissez une image ici</span>
              <span className="text-xs">ou cliquez pour parcourir</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
