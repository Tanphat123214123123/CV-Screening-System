import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, UserRound } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { login } from '../services/authService';

const demoAccounts = [
  { email: 'hr@demo.com', label: 'Nhà tuyển dụng', Icon: Briefcase },
  { email: 'candidate@demo.com', label: 'Ứng viên', Icon: UserRound },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setUser(user);
      navigate(user.role === 'HR' ? '/hr' : '/jobs');
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={<>Chào mừng <span className="accent-italic">trở lại</span></>}
      subtitle="Đăng nhập để tiếp tục sàng lọc hoặc theo dõi đơn ứng tuyển."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <div>
          <label htmlFor="login-email" className="field-label">Email</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="ban@congty.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="field-label">Mật khẩu</label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            className="input"
          />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-clay">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Đang đăng nhập…' : <>Đăng nhập <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
        </button>
      </form>

      {/* Chi hien khi chay dev - ban build production khong lo tai khoan demo */}
      {import.meta.env.DEV && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/15 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45">Dùng thử nhanh · mật khẩu 123456</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map(({ email: demoEmail, label, Icon }) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword('123456');
                  setError('');
                }}
                className="flex items-center gap-2.5 rounded-xl border border-ink/10 px-3 py-2.5 text-left transition hover:border-moss/40 hover:bg-moss/5"
              >
                <Icon className="h-4 w-4 text-moss" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-ink/50">{demoEmail}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-sm text-ink/60">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-moss underline-offset-4 hover:underline">
          Tạo tài khoản mới
        </Link>
      </p>
    </AuthLayout>
  );
}
