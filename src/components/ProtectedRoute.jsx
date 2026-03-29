import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ reqAdmin = false }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (reqAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Use Outlet for nested routes
  return <Outlet />;
}
