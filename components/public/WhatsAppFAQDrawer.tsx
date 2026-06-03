'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, MessageCircle, Send } from 'lucide-react';
import { getWhatsAppHref } from '@/lib/utils/contact';

interface WhatsAppFAQDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber: string | null;
}

const FAQ_KEYS = [
  { q: 'q1', a: 'a1' },
  { q: 'q2', a: 'a2' },
  { q: 'q3', a: 'a3' },
  { q: 'q4', a: 'a4' },
  { q: 'q5', a: 'a5' },
] as const;

export function WhatsAppFAQDrawer({ isOpen, onClose, whatsappNumber }: WhatsAppFAQDrawerProps) {
  const t = useTranslations('whatsapp');
  const locale = useLocale();
  const [message, setMessage] = useState('');
  const isRtl = locale === 'ar';

  const handleSelectQuestion = useCallback((answerKey: string) => {
    setMessage(t(answerKey));
  }, [t]);

  const handleSend = useCallback(() => {
    if (!whatsappNumber) return;
    const href = getWhatsAppHref(whatsappNumber, message || undefined);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    setMessage('');
    onClose();
  }, [whatsappNumber, message, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 w-full max-w-md bg-surface z-50 shadow-2xl flex flex-col ${
          isRtl ? 'left-0' : 'right-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm bg-green-500">
          <div className="flex items-center gap-2 text-white">
            <MessageCircle className="w-5 h-5" />
            <h2 className="text-base font-bold">{t('faqTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="px-5 py-3 text-sm text-text-muted bg-surface-2">
          {t('faqSubtitle')}
        </p>

        {/* FAQ List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {FAQ_KEYS.map(({ q, a }, i) => (
            <button
              key={i}
              onClick={() => handleSelectQuestion(a)}
              className={`w-full text-left rounded-xl border-2 border-green-200 bg-green-50/50 px-4 py-3 hover:bg-green-50 hover:border-green-400 transition-all active:scale-[0.98] ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            >
              <span className="block text-sm font-semibold text-green-700 mb-1">
                {t(q)}
              </span>
              <span className="block text-xs text-green-600/80 leading-relaxed">
                {t(a)}
              </span>
            </button>
          ))}

          {/* Custom message textarea */}
          <div className="pt-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('customMessagePlaceholder')}
              rows={3}
              className={`w-full rounded-xl border border-border-warm bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 resize-none ${
                isRtl ? 'text-right' : 'text-left'
              }`}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        {/* Footer button */}
        <div className="px-5 py-4 border-t border-border-warm bg-surface">
          <button
            onClick={handleSend}
            disabled={!whatsappNumber}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white rounded-xl font-semibold shadow-md hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {t('sendMessage')}
          </button>
        </div>
      </div>
    </>
  );
}
