import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, FileStack, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../lib/format';
import SieveMark, { Wordmark } from '../brand/SieveMark';
import SessionWatcher from './SessionWatcher';

const navByRole = {
  HR: [{ to: '/hr', label: 'Tổng quan', Icon: LayoutDashboard }],
  CANDIDATE: [
    { to: '/jobs', label: 'Việc làm', Icon: Briefcase },
    { to: '/my-applications', label: 'Đơn của tôi', Icon: FileStack },
  ],
} as const;

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="btn-ghost h-9 w-9 p-0"
      aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  // Dong menu mobile khi chuyen trang
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  const handleLogout = () => {
    logout();
    // Xoa cache de nguoi dang nhap sau khong thay du lieu cua nguoi truoc
    queryClient.clear();
    navigate('/login');
  };

  const links = user ? navByRole[user.role] : [];
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-ink text-paper' : 'text-ink/65 hover:bg-ink/[0.06] hover:text-ink'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <SessionWatcher />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
        Bỏ qua điều hướng
      </a>
      <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-paper/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="TalentSift — trang chủ">
            <SieveMark />
            <Wordmark />
          </Link>

          {user && (
            <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
              {links.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className={linkClass}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <>
                <div className="ml-2 hidden items-center gap-2.5 border-l border-ink/10 pl-3 md:flex">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-amber text-xs font-bold text-night">
                    {initials(user.fullName)}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-[11px] text-ink/50">{user.role === 'HR' ? 'Nhà tuyển dụng' : 'Ứng viên'}</p>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost ml-1 h-9 w-9 p-0" aria-label="Đăng xuất" title="Đăng xuất">
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="btn-ghost h-9 w-9 p-0 md:hidden"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Mở menu"
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              location.pathname !== '/login' && (
                <Link to="/login" className="btn-primary ml-1">Đăng nhập</Link>
              )
            )}
          </div>
        </div>

        {user && menuOpen && (
          <div id="mobile-menu" className="animate-fade-up border-t border-ink/[0.06] px-4 pb-4 pt-2 md:hidden">
            <nav aria-label="Điều hướng (di động)" className="flex flex-col gap-1">
              {links.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className={linkClass}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-ink/[0.06] pt-3">
              <span className="text-sm">
                <span className="font-semibold">{user.fullName}</span>
                <span className="text-ink/50"> · {user.role === 'HR' ? 'Nhà tuyển dụng' : 'Ứng viên'}</span>
              </span>
              <button onClick={handleLogout} className="btn-outline py-1.5">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Đăng xuất
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-ink/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-ink/45 sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} TalentSift · Đồ án sàng lọc CV bằng AI</span>
          <span>Spring Boot · Python NLP · AWS S3/SQS · React</span>
        </div>
      </footer>
    </div>
  );
}
