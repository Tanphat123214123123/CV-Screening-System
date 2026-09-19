import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      setUser(user);
      navigate(user.role === 'HR' ? '/hr/jobs' : '/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div className="hidden lg:block animate-fade-up">
        <span className="eyebrow text-moss">TalentSift · Sàng lọc CV bằng AI</span>
        <h1 className="mt-4 font-display text-display-xl font-semibold text-ink">
          Tìm đúng người,
          <br />
          <em className="text-moss not-italic">đúng lúc.</em>
        </h1>
        <p className="mt-5 max-w-sm text-ink/60">
          AI đọc CV, đối chiếu kỹ năng, xếp hạng ứng viên — để đội tuyển dụng chỉ tập trung vào những
          hồ sơ đáng giá nhất.
        </p>
      </div>

      <div className="panel animate-fade-up border-t-2 border-t-ink p-7 sm:p-8">
        <span className="eyebrow text-ink/40">Biểu mẫu · Đăng nhập</span>
        <h2 className="mt-2 font-display text-display font-semibold">Đăng nhập</h2>
        <p className="mt-1 text-sm text-ink/50">
          Tài khoản demo: hr@demo.com hoặc candidate@demo.com — mật khẩu 123456
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          {error && <p className="text-sm font-medium text-rust">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
          <p className="text-center text-sm text-ink/50">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-moss transition-colors duration-200 hover:text-ink">
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
