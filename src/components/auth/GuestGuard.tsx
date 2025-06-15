
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const GuestGuard = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/analysis" replace />;
  }

  return <Outlet />;
};

export default GuestGuard;
