import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import Layout from './components/common/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/candidate/JobList';
import MyApplications from './pages/candidate/MyApplications';
import CandidateReview from './pages/hr/CandidateReview';
import JobManagement from './pages/hr/JobManagement';
import type { Role } from './types';

function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'HR' ? '/hr/jobs' : '/jobs'} replace />;
  }
  return <>{children}</>;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  return <Navigate to={user.role === 'HR' ? '/hr/jobs' : '/jobs'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route
            path="/jobs"
            element={<Layout><Protected role="CANDIDATE"><JobList /></Protected></Layout>}
          />
          <Route
            path="/my-applications"
            element={<Layout><Protected role="CANDIDATE"><MyApplications /></Protected></Layout>}
          />
          <Route
            path="/hr/jobs"
            element={<Layout><Protected role="HR"><JobManagement /></Protected></Layout>}
          />
          <Route
            path="/hr/review"
            element={<Layout><Protected role="HR"><CandidateReview /></Protected></Layout>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
