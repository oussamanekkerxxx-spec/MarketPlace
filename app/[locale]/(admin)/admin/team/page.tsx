import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Équipe',
};
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TeamInviteForm } from '@/components/admin/TeamInviteForm';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import { UserPlus } from 'lucide-react';

export default async function TeamPage() {
  const supabase = await createClient();

  type MemberRow = {
    id: string;
    full_name: string | null;
    role: string;
    phone: string | null;
    created_at: string;
    auth_users: { email: string } | null;
  };

  const { data: membersRaw } = await supabase
    .from('profiles')
    .select('*, auth_users:auth.users(email)')
    .order('created_at', { ascending: false });

  const members = (membersRaw as MemberRow[] | null) || [];

  return (
    <div>
      <PageHeader
        title="Équipe"
        description={`${members.length} membre${members.length > 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* List — first on mobile */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {members.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                Aucun membre
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border shadow-sm p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold shrink-0">
                    {(m.full_name?.[0] || m.auth_users?.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {m.full_name || 'Sans nom'}
                      </p>
                      <StatusBadge
                        status={m.role === 'admin' ? 'active' : 'inactive'}
                        customLabel={m.role === 'admin' ? 'Admin' : 'Manager'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {m.auth_users?.email || m.phone || '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <DataTable
              data={members}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucun membre"
              columns={[
                {
                  key: 'name',
                  header: 'Nom',
                  cell: (row) => (
                    <div>
                      <div className="font-medium">{row.full_name || 'Sans nom'}</div>
                      <div className="text-xs text-gray-500">{row.auth_users?.email}</div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Rôle',
                  cell: (row) => <StatusBadge status={row.role === 'admin' ? 'active' : 'inactive'} customLabel={row.role === 'admin' ? 'Admin' : 'Manager'} />,
                },
                {
                  key: 'phone',
                  header: 'Téléphone',
                  cell: (row) => row.phone || '-',
                },
                {
                  key: 'created',
                  header: 'Date',
                  cell: (row) => new Date(row.created_at).toLocaleDateString('fr-FR'),
                },
              ]}
            />
          </div>
        </div>

        {/* Form — accordion on mobile */}
        <div className="lg:col-span-1 lg:order-1 order-2">
          <div className="lg:hidden">
            <AdminAccordion
              title="Inviter un membre"
              description="Envoyer une invitation par e-mail"
              icon={<UserPlus className="w-4 h-4" />}
            >
              <TeamInviteForm />
            </AdminAccordion>
          </div>
          <div className="hidden lg:block bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Inviter un membre</h2>
            <TeamInviteForm />
          </div>
        </div>
      </div>
    </div>
  );
}
