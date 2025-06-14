
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';

const ProtectedRoute = () => {
  const { session, loading: authLoading, user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
      queryKey: ['profile', user?.id],
      queryFn: async () => {
          if (!user) return null;
          const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (error) {
              if (error.code === 'PGRST116') return null; // Profile might not exist yet
              console.error("Error fetching profile in ProtectedRoute", error);
              return null;
          }
          return data as Profile;
      },
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (profile?.is_banned) {
    // Log out banned user
    supabase.auth.signOut();
    return <Navigate to="/auth?message=banned" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
