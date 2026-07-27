import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import Layout from './components/common/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'HR' ? '/hr/jobs' : '/jobs'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<Protected role="CANDIDATE"><JobList /></Protected>} />
            <Route path="/my-applications" element={<Protected role="CANDIDATE"><MyApplications /></Protected>} />
            <Route path="/hr/jobs" element={<Protected role="HR"><JobManagement /></Protected>} />
            <Route path="/hr/review" element={<Protected role="HR"><CandidateReview /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
