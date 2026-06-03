'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';

interface ProductQRCodeProps {
  slug: string;
  locale: string;
  label?: string;
}

export function ProductQRCode({ slug, locale, label }: ProductQRCodeProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const { default: QRCode } = await import('qrcode');
      const url = `${window.location.origin}/${locale}/product/${slug}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-${slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Erreur lors de la génération du QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
    >
      <QrCode className="w-3 h-3" />
      {label || (loading ? '...' : 'QR')}
    </button>
  );
}
