'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (!userProfile || userProfile.role !== 'admin') {
    throw new Error('Accès réservé aux administrateurs');
  }
}

export async function inviteUser(email: string, role: 'admin' | 'manager') {
  await checkAdmin();
  const supabase = await createClient();

  // Invite user via Supabase Auth
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role },
  });

  if (error) return { error: error.message };

  // Update profile role (the trigger creates the profile, but defaults to manager)
  if (data.user) {
    await supabase.from('profiles').update({ role }).eq('id', data.user.id);
  }

  revalidatePath('/[locale]/admin/team', 'page');
  return { success: true };
}

export async function updateUserRole(userId: string, role: 'admin' | 'manager') {
  await checkAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/team', 'page');
  return { success: true };
}
