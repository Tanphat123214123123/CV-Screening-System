import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import AppShell from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import JobBoard from './pages/candidate/JobBoard';
import JobDetail from './pages/candidate/JobDetail';
import MyApplications from './pages/candidate/MyApplications';
import CandidateReview from './pages/hr/CandidateReview';
import Dashboard from './pages/hr/Dashboard';
import type { Role } from './types';

/** Bat truoc hanh vi cua React Router v7 (het canh bao, de nang cap sau nay). */
export const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

const homeOf = (role: Role) => (role === 'HR' ? '/hr' : '/jobs');

function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeOf(user.role)} replace />;
  return <>{children}</>;
}

/** Trang dang nhap/dang ky: da dang nhap roi thi dua ve trang chinh. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to={homeOf(user.role)} replace /> : <>{children}</>;
}

function Home() {
  const { user } = useAuth();
  return user ? <Navigate to={homeOf(user.role)} replace /> : <Landing />;
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        <Route path="/jobs" element={<Protected role="CANDIDATE"><JobBoard /></Protected>} />
        <Route path="/jobs/:id" element={<Protected role="CANDIDATE"><JobDetail /></Protected>} />
        <Route path="/my-applications" element={<Protected role="CANDIDATE"><MyApplications /></Protected>} />

        <Route path="/hr" element={<Protected role="HR"><Dashboard /></Protected>} />
        <Route path="/hr/jobs/:jobId" element={<Protected role="HR"><CandidateReview /></Protected>} />
        {/* Duong dan cu -> trang tong quan moi */}
        <Route path="/hr/jobs" element={<Navigate to="/hr" replace />} />
        <Route path="/hr/review" element={<Navigate to="/hr" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter future={routerFuture}>
      <AppRoutes />
    </BrowserRouter>
  );
}
