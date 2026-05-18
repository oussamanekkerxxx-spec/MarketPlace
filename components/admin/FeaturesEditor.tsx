'use client';

import { useState, useEffect } from 'react';

interface FeaturesValue {
  features_fr?: string[];
  features_en?: string[];
  features_ar?: string[];
}

interface FeaturesEditorProps {
  value: FeaturesValue;
  onChange: (value: FeaturesValue) => void;
}

const LOCALES = [
  { key: 'fr', label: 'Français' },
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
] as const;

export function FeaturesEditor({ value, onChange }: FeaturesEditorProps) {
  const [activeLocale, setActiveLocale] = useState<'fr' | 'en' | 'ar'>('fr');

  const getFeatures = (locale: 'fr' | 'en' | 'ar'): string[] => {
    return value[`features_${locale}` as keyof FeaturesValue] || [];
  };

  const updateFeatures = (locale: 'fr' | 'en' | 'ar', features: string[]) => {
    const cleaned = features.filter((f) => f.trim() !== '');
    onChange({
      ...value,
      [`features_${locale}`]: cleaned.length > 0 ? cleaned : undefined,
    });
  };

  const addBullet = (locale: 'fr' | 'en' | 'ar') => {
    const current = getFeatures(locale);
    updateFeatures(locale, [...current, '']);
  };

  const updateBullet = (locale: 'fr' | 'en' | 'ar', index: number, text: string) => {
    const current = getFeatures(locale);
    const next = [...current];
    next[index] = text;
    updateFeatures(locale, next);
  };

  const removeBullet = (locale: 'fr' | 'en' | 'ar', index: number) => {
    const current = getFeatures(locale);
    updateFeatures(locale, current.filter((_, i) => i !== index));
  };

  const moveBullet = (locale: 'fr' | 'en' | 'ar', index: number, direction: 'up' | 'down') => {
    const current = getFeatures(locale);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === current.length - 1) return;
    const next = [...current];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    updateFeatures(locale, next);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {LOCALES.map((loc) => (
          <button
            key={loc.key}
            type="button"
            onClick={() => setActiveLocale(loc.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeLocale === loc.key
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {getFeatures(activeLocale).map((bullet, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-green-500 text-sm">✓</span>
            <input
              type="text"
              value={bullet}
              onChange={(e) => updateBullet(activeLocale, i, e.target.value)}
              placeholder={`Point ${i + 1}`}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveBullet(activeLocale, i, 'up')}
                disabled={i === 0}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBullet(activeLocale, i, 'down')}
                disabled={i === getFeatures(activeLocale).length - 1}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeBullet(activeLocale, i)}
                className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {getFeatures(activeLocale).length === 0 && (
          <p className="text-sm text-gray-400 italic">Aucune caractéristique pour cette langue.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => addBullet(activeLocale)}
        className="text-sm text-orange-600 font-medium hover:underline"
      >
        + Ajouter un point
      </button>
    </div>
  );
}
