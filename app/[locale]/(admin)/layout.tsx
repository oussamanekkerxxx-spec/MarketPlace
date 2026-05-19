import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/components/admin/ToastProvider';
import { BuildInfo } from '@/components/admin/BuildInfo';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | Admin',
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Verify staff role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-x-clip">
      <AdminSidebar locale={locale} role={userProfile.role} />
      <div className="flex-1 min-w-0 flex flex-col lg:ml-64">
        <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pt-6 overflow-x-clip">{children}</main>
        <BuildInfo />
      </div>
      <ToastProvider />
    </div>
  );
}
