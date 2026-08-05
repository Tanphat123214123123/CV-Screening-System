import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-mint">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            Talent<span className="text-amber">Sift</span>
          </Link>
          {user && (
            <nav className="flex items-center gap-5 text-sm">
              {user.role === 'HR' ? (
                <>
                  <Link to="/hr/jobs" className="hover:text-amber">Tin tuyển dụng</Link>
                  <Link to="/hr/review" className="hover:text-amber">Ứng viên</Link>
                </>
              ) : (
                <>
                  <Link to="/jobs" className="hover:text-amber">Việc làm</Link>
                  <Link to="/my-applications" className="hover:text-amber">Đơn của tôi</Link>
                </>
              )}
              <span className="hidden text-mint/60 sm:inline">{user.fullName}</span>
              <button
                onClick={handleLogout}
                className="rounded border border-mint/40 px-3 py-1 hover:bg-mint/10"
              >
                Đăng xuất
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
