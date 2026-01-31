import { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Only check auth if we're not already authenticated
    if (!isAuthenticated && !user) {
      checkAuth().finally(() => {
        if (isMountedRef.current) {
          setIsChecking(false);
        }
      });
    } else {
      setIsChecking(false);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, user, checkAuth]);

  if (isLoading || isChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
