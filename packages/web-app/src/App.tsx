import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Chores from './pages/Chores';
import Rewards from './pages/Rewards';
import Shop from './pages/Shop';
import Jobs from './pages/Jobs';
import FamilyRules from './pages/FamilyRules';
import Approvals from './pages/Approvals';
import ScreenTime from './pages/ScreenTime';
import Settings from './pages/Settings';
import JoinFamily from './pages/JoinFamily';
import Layout from './components/Layout';

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, family } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (family) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, family } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!family) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { initializeAuth } = useStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join/:token" element={<JoinFamily />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <AppRoute>
            <Layout />
          </AppRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chores" element={<Chores />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/family-rules" element={<FamilyRules />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/screen-time" element={<ScreenTime />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
