'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Star, Trash2, UploadCloud } from 'lucide-react';

export interface ProductImageInput {
  url: string;
  alt_text?: string | null;
  display_order: number;
  is_primary?: boolean | null;
}

interface ImageUploaderProps {
  value: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadError('');

      const supabase = createClient();
      const newImages: ProductImageInput[] = [];

      for (const file of Array.from(files)) {
        try {
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
              contentType: file.type || 'image/jpeg',
              cacheControl: '31536000',
            });

          if (uploadError) {
            console.error('Upload failed:', uploadError);
            setUploadError(`Échec de l'upload: ${uploadError.message}`);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          newImages.push({
            url: urlData.publicUrl,
            alt_text: '',
            display_order: value.length + newImages.length,
            is_primary: value.length === 0 && newImages.length === 0,
          });
        } catch (err) {
          console.error('Compression or upload error:', err);
          setUploadError("Erreur lors du traitement de l'image");
        }
      }

      if (newImages.length > 0) {
        onChange([...value, ...newImages]);
      }
      setUploading(false);
    },
    [value, onChange]
  );

  const removeImage = useCallback(
    async (index: number) => {
      const image = value[index];
      if (!image) return;

      // Try to delete from storage (best effort)
      try {
        const supabase = createClient();
        const url = new URL(image.url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex((p) => p === 'product-images');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from('product-images').remove([filePath]);
        }
      } catch {
        // Ignore storage deletion errors
      }

      const next = value.filter((_, i) => i !== index);
      const reordered = next.map((img, i) => ({
        ...img,
        display_order: i,
        is_primary: i === 0 ? true : img.is_primary,
      }));
      onChange(reordered);
    },
    [value, onChange]
  );

  const setPrimary = useCallback(
    (index: number) => {
      const next = value.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      onChange(next);
    },
    [value, onChange]
  );

  const moveImage = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= value.length) return;
      const next = [...value];
      const [moved] = next.splice(index, 1);
      next.splice(newIndex, 0, moved);
      const reordered = next.map((img, i) => ({
        ...img,
        display_order: i,
      }));
      onChange(reordered);
    },
    [value, onChange]
  );

  const updateAltText = useCallback(
    (index: number, altText: string) => {
      const next = value.map((img, i) =>
        i === index ? { ...img, alt_text: altText } : img
      );
      onChange(next);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Upload dropzone — bigger target, lucide icon for consistency */}
      <label
        htmlFor="image-upload"
        className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <div className="flex flex-col items-center gap-2">
          <UploadCloud className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
          <span className="text-sm text-gray-600">
            {uploading
              ? 'Traitement des images...'
              : 'Cliquez ou glissez des images ici'}
          </span>
          <span className="text-xs text-gray-400">
            JPG, PNG — plusieurs fichiers acceptés
          </span>
        </div>
      </label>

      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {value.map((image, index) => (
            <div
              key={image.url}
              className={`relative rounded-lg border bg-white overflow-hidden ${
                image.is_primary ? 'ring-2 ring-orange-500' : 'border-gray-200'
              }`}
            >
              {/* Image */}
              <div className="aspect-square relative bg-gray-100">
                <Image
                  src={image.url}
                  alt={image.alt_text || ''}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                  className="object-cover"
                />

                {/* Primary badge */}
                {image.is_primary && (
                  <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                    Principale
                  </span>
                )}
              </div>

              {/* ───── Always-visible control bar (no hover required) ─────── */}
              <div className="flex items-center justify-between gap-0.5 p-1 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  aria-label="Déplacer à gauche"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  disabled={!!image.is_primary}
                  aria-label={
                    image.is_primary ? 'Image principale' : 'Définir comme image principale'
                  }
                  className={`w-10 h-10 inline-flex items-center justify-center rounded-md transition-colors ${
                    image.is_primary
                      ? 'text-orange-600 bg-orange-100'
                      : 'text-gray-500 hover:bg-white active:bg-gray-200'
                  }`}
                >
                  <Star
                    className="w-4 h-4"
                    fill={image.is_primary ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Déplacer à droite"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Supprimer"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Alt text input */}
              <div className="p-2 border-t bg-white">
                <input
                  type="text"
                  value={image.alt_text || ''}
                  onChange={(e) => updateAltText(index, e.target.value)}
                  placeholder="Texte alternatif"
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
