
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, user, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only perform this check when auth state is loaded
    if (!isLoading) {
      // Add a small delay to ensure isAdmin state is updated
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAdmin]);

  if (isLoading || isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-brand-600">Checking admin permissions...</p>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User is admin, render the protected component
  return <>{children}</>;
};

export default AdminRoute;
