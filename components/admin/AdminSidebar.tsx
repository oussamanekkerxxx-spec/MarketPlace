'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/lib/i18n/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Settings,
  Users,
  LogOut,
  BarChart3,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/reports', label: 'Rapports', icon: BarChart3 },
  { href: '/admin/content/why-us', label: 'Pourquoi nous', icon: HelpCircle },
];

const adminOnlyItems = [
  { href: '/admin/settings', label: 'Parametres', icon: Settings },
  { href: '/admin/team', label: 'Equipe', icon: Users },
];

export function AdminSidebar({ locale, role }: { locale: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  const allItems = role === 'admin' ? [...navItems, ...adminOnlyItems] : navItems;

  const navContent = (
    <>
      <div className="p-6 border-b flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Admin
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as '/admin'}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Deconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - visible only on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 inline-flex items-center gap-2 px-3 py-2.5 bg-orange-600 text-white rounded-lg shadow-lg hover:bg-orange-700 active:scale-95 transition-all"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Menu className="w-5 h-5" />
        <span className="text-sm font-semibold">Menu</span>
      </button>

      {/* Backdrop - mobile only */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar - always visible from lg+ */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r hidden lg:flex flex-col z-30">
        {navContent}
      </aside>

      {/* Mobile drawer - slides in from left */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r flex flex-col z-50 shadow-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {navContent}
      </aside>
    </>
  );
}
