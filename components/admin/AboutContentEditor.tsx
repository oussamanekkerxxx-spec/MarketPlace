'use client';

import { useState } from 'react';
import { updateAboutContentBatch } from '@/lib/actions/aboutPage';
import { TrilingualField } from '@/components/admin/TrilingualField';

type AboutItem = {
  id: string;
  section: string;
  key: string;
  order_index: number;
  content_fr: string;
  content_en: string | null;
  content_ar: string | null;
  active: boolean;
};

interface AboutContentEditorProps {
  items: AboutItem[];
}

const SECTION_LABELS: Record<string, { title: string; description: string }> = {
  story: {
    title: 'Notre histoire',
    description: 'Les paragraphes de la section histoire sur la page À propos.',
  },
  values: {
    title: 'Nos valeurs',
    description: 'Les éléments de la liste de valeurs.',
  },
  cta: {
    title: 'Appel à action',
    description: 'Le titre, le texte et le bouton de la section CTA en bas de page.',
  },
};

const KEY_LABELS: Record<string, string> = {
  paragraph_1: 'Paragraphe 1',
  paragraph_2: 'Paragraphe 2',
  paragraph_3: 'Paragraphe 3',
  paragraph_4: 'Paragraphe 4',
  value_1: 'Valeur 1',
  value_2: 'Valeur 2',
  value_3: 'Valeur 3',
  value_4: 'Valeur 4',
  value_5: 'Valeur 5',
  title: 'Titre CTA',
  subtitle: 'Sous-titre CTA',
  button: 'Texte du bouton',
};

export function AboutContentEditor({ items }: AboutContentEditorProps) {
  const [formData, setFormData] = useState<Record<string, AboutItem>>(
    () => Object.fromEntries(items.map((it) => [it.id, { ...it }]))
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const grouped = {
    story: items.filter((i) => i.section === 'story').sort((a, b) => a.order_index - b.order_index),
    values: items.filter((i) => i.section === 'values').sort((a, b) => a.order_index - b.order_index),
    cta: items.filter((i) => i.section === 'cta').sort((a, b) => a.order_index - b.order_index),
  };

  const handleChange = (id: string, field: 'content_fr' | 'content_en' | 'content_ar', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setStatus('loading');
    const payload = Object.values(formData).map((it) => ({
      id: it.id,
      content_fr: it.content_fr,
      content_en: it.content_en,
      content_ar: it.content_ar,
    }));

    const result = await updateAboutContentBatch(payload);
    if ('error' in result) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Contenu mis à jour avec succès');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-8"
    >
      {status === 'success' && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{message}</div>
      )}
      {status === 'error' && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">{message}</div>
      )}

      {(['story', 'values', 'cta'] as const).map((section) => (
        <section key={section} className="bg-white rounded-xl border shadow-sm p-5 lg:p-6">
          <div className="mb-5 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{SECTION_LABELS[section].title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{SECTION_LABELS[section].description}</p>
          </div>

          <div className="space-y-5">
            {grouped[section].map((item) => {
              const data = formData[item.id];
              if (!data) return null;
              return (
                <div key={item.id}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    {KEY_LABELS[item.key] || item.key}
                  </p>
                  <TrilingualField
                    fr={
                      <textarea
                        value={data.content_fr}
                        onChange={(e) => handleChange(item.id, 'content_fr', e.target.value)}
                        rows={section === 'values' ? 2 : 4}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="Français"
                      />
                    }
                    en={
                      <textarea
                        value={data.content_en || ''}
                        onChange={(e) => handleChange(item.id, 'content_en', e.target.value)}
                        rows={section === 'values' ? 2 : 4}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="English"
                      />
                    }
                    ar={
                      <textarea
                        value={data.content_ar || ''}
                        onChange={(e) => handleChange(item.id, 'content_ar', e.target.value)}
                        rows={section === 'values' ? 2 : 4}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="العربية"
                        dir="rtl"
                      />
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {status === 'loading' ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
        {status === 'success' && (
          <span className="text-sm text-green-600 font-medium">Enregistré ✓</span>
        )}
      </div>
    </form>
  );
}
