import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAdminProfileByUserId } from '@/app/(admin)/actions/adminActions';

export interface CurrentUser {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  passport_code?: string;
  address?: string;
  role?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        // Dùng server action bypass RLS để lấy profile
        const data = await getAdminProfileByUserId(session.user.id);

        const meta = session.user.user_metadata || {};

        setUser({ 
          id: session.user.id,
          email: session.user.email || '',
          display_name: data?.display_name || meta.full_name || meta.name || '',
          avatar_url: data?.avatar_url || meta.avatar_url || meta.picture || '',
          username: data?.username || meta.username || '',
          role: data?.role || meta.role || 'Admin',
          address: data?.address || meta.address || '',
          bio: data?.bio || meta.bio || '',
          passport_code: data?.passport_code || '',
          ...(data || {}) 
        });
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
