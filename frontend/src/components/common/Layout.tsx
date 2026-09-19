import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks =
    user?.role === 'HR'
      ? [
          { to: '/hr/jobs', label: 'Tin tuyển dụng' },
          { to: '/hr/review', label: 'Ứng viên' },
        ]
      : [
          { to: '/jobs', label: 'Việc làm' },
          { to: '/my-applications', label: 'Đơn của tôi' },
        ];

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-amber bg-ink text-mint">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight text-paper">
            Talent<em className="text-amber not-italic">Sift</em>
          </Link>
          {user && (
            <nav className="flex items-center gap-6">
              <div className="hidden items-center gap-5 sm:flex">
                {navLinks.map((link) => {
                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`eyebrow border-b-2 pb-0.5 transition-colors duration-200 ${
                        active
                          ? 'border-amber text-paper'
                          : 'border-transparent text-mint/60 hover:border-amber/50 hover:text-paper'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <span className="hidden font-mono text-xs text-mint/50 md:inline">{user.fullName}</span>
              <button
                onClick={handleLogout}
                className="eyebrow rounded border border-mint/30 px-3 py-1.5 text-mint/80 transition-colors duration-200 hover:border-amber hover:text-paper"
              >
                Đăng xuất
              </button>
            </nav>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-5 border-t border-mint/10 px-4 py-2 sm:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`eyebrow ${location.pathname === link.to ? 'text-paper' : 'text-mint/60'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
