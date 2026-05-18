'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import {
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Upload,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import type { DetailSectionFormData } from '@/lib/validation/product';
import { TrilingualField } from './TrilingualField';

interface NarrativeSectionsEditorProps {
  value: DetailSectionFormData[];
  onChange: (sections: DetailSectionFormData[]) => void;
  bucket?: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
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
  if (blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export function NarrativeSectionsEditor({
  value,
  onChange,
  bucket = 'product-images',
}: NarrativeSectionsEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const [openSectionId, setOpenSectionId] = useState<string | null>(value[0]?.id || null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncLayout = () => setIsDesktop(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);

    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  const resolvedOpenSectionId =
    openSectionId && value.some((section) => section.id === openSectionId)
      ? openSectionId
      : value[0]?.id || null;

  const updateSection = (index: number, patch: Partial<DetailSectionFormData>) => {
    const next = value.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  const addSection = () => {
    const nextSection = {
      id: crypto.randomUUID(),
      image: '',
      headline_fr: '',
      headline_en: '',
      headline_ar: '',
      body_fr: '',
      body_en: '',
      body_ar: '',
      position: 'center' as const,
      theme: 'light' as const,
    };

    onChange([
      ...value,
      nextSection,
    ]);
    setOpenSectionId(nextSection.id);
  };

  const removeSection = (index: number) => {
    const removedSectionId = value[index]?.id;
    const next = value.filter((_, i) => i !== index);
    onChange(next);

    if (removedSectionId && removedSectionId === openSectionId) {
      setOpenSectionId(next[index]?.id || next[index - 1]?.id || null);
    }
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const swap = index + dir;
    if (swap < 0 || swap >= value.length) return;
    const next = [...value];
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  };

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) return null;

      let processedFile = file;
      try {
        processedFile = await compressImage(file);
      } catch {
        /* fall through to size check */
      }

      if (processedFile.size > MAX_FILE_SIZE_BYTES) {
        alert(
          `L'image est trop volumineuse (${(processedFile.size / 1024 / 1024).toFixed(1)} Mo). Max: ${MAX_FILE_SIZE_MB} Mo.`
        );
        return null;
      }

      const supabase = createClient();
      const ext = processedFile.name.split('.').pop() || 'jpg';
      const fileName = `narrative-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          upsert: false,
          contentType: processedFile.type,
          cacheControl: '31536000',
        });

      if (uploadError) {
        alert(uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    },
    [bucket]
  );

  const handleFileSelect = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingIndex(index);
    const url = await uploadFile(file);
    setUploadingIndex(null);
    if (url) {
      updateSection(index, { image: url });
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSectionId((current) => (current === sectionId ? null : sectionId));
  };

  return (
    <div className="space-y-4">
      {value.map((section, index) => {
        const isOpen = isDesktop || section.id === resolvedOpenSectionId;
        const sectionLabel = section.headline_fr?.trim() || section.headline_en?.trim() || section.headline_ar?.trim() || `Section ${index + 1}`;

        return (
          <div
            key={section.id}
            className="border rounded-xl bg-white overflow-hidden shadow-sm"
          >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
            <button
              type="button"
              onClick={() => !isDesktop && toggleSection(section.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-xs font-semibold uppercase text-gray-500">
                Section {index + 1}
              </span>
              <span className="truncate text-sm font-medium text-gray-700">
                {sectionLabel}
              </span>
              {!isDesktop && (
                <ChevronDown
                  className={`ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              )}
            </button>
            <div className="ml-2 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-25 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, 1)}
                disabled={index === value.length - 1}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-25 transition-colors"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeSection(index)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
            style={{
              maxHeight: isOpen ? '2500px' : '0px',
              opacity: isOpen ? 1 : 0,
            }}
            aria-hidden={!isOpen}
          >
            <div className="p-3 space-y-3">
              {/* Image upload area */}
              <div>
              {section.image ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={section.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                  <button
                    type="button"
                    onClick={() => updateSection(index, { image: '' })}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-white shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current.get(index)?.click()}
                  disabled={uploadingIndex === index}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
                >
                  {uploadingIndex === index ? (
                    <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Choisir une image</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(index, el);
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  e.target.value = '';
                  handleFileSelect(index, file);
                }}
              />
              </div>

            {/* Headline */}
              <TrilingualField
              label="Titre"
              fr={
                <input
                  type="text"
                  value={section.headline_fr}
                  onChange={(e) => updateSection(index, { headline_fr: e.target.value })}
                  placeholder="Titre en français..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              }
              en={
                <input
                  type="text"
                  value={section.headline_en}
                  onChange={(e) => updateSection(index, { headline_en: e.target.value })}
                  placeholder="Headline in English..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              }
              ar={
                <input
                  type="text"
                  value={section.headline_ar}
                  onChange={(e) => updateSection(index, { headline_ar: e.target.value })}
                  placeholder="العنوان بالعربية..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  dir="rtl"
                />
              }
              />

            {/* Body */}
              <TrilingualField
              label="Description"
              fr={
                <textarea
                  value={section.body_fr}
                  onChange={(e) => updateSection(index, { body_fr: e.target.value })}
                  placeholder="Description en français..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-y"
                />
              }
              en={
                <textarea
                  value={section.body_en}
                  onChange={(e) => updateSection(index, { body_en: e.target.value })}
                  placeholder="Description in English..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-y"
                />
              }
              ar={
                <textarea
                  value={section.body_ar}
                  onChange={(e) => updateSection(index, { body_ar: e.target.value })}
                  placeholder="الوصف بالعربية..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-y"
                  dir="rtl"
                />
              }
              />

            {/* Position + Theme toggles */}
              <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 mr-1">Position</span>
                {([
                  { key: 'center', icon: AlignCenter },
                  { key: 'left', icon: AlignLeft },
                  { key: 'right', icon: AlignRight },
                ] as const).map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSection(index, { position: key })}
                    className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${
                      section.position === key
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title={key}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 mr-1">Thème</span>
                {([
                  { key: 'light', icon: Sun, label: 'Clair' },
                  { key: 'dark', icon: Moon, label: 'Sombre' },
                ] as const).map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateSection(index, { theme: key })}
                    className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors ${
                      section.theme === key
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title={key}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>
        );
      })}

      <button
        type="button"
        onClick={addSection}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Ajouter une section narrative
      </button>
      <p className="text-[11px] text-gray-400">
        Chaque section = un visuel plein écran + un argument de vente. Les images sont compressées automatiquement (max {MAX_DIMENSION}px, {MAX_FILE_SIZE_MB} Mo).
      </p>
    </div>
  );
}
