import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/authService';
import type { Role } from '../types';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CANDIDATE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(fullName, email, password, role);
      setUser(user);
      navigate(user.role === 'HR' ? '/hr/jobs' : '/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div className="hidden lg:block animate-fade-up">
        <span className="eyebrow text-moss">TalentSift · Sàng lọc CV bằng AI</span>
        <h1 className="mt-4 font-display text-display-xl font-semibold text-ink">
          Mở một
          <br />
          <em className="text-moss not-italic">hồ sơ mới.</em>
        </h1>
        <p className="mt-5 max-w-sm text-ink/60">
          Ứng viên nộp CV, nhà tuyển dụng đăng tin — AI lo phần đối chiếu và xếp hạng ở giữa.
        </p>
      </div>

      <div className="panel animate-fade-up border-t-2 border-t-ink p-7 sm:p-8">
        <span className="eyebrow text-ink/40">Biểu mẫu · Đăng ký</span>
        <h2 className="mt-2 font-display text-display font-semibold">Tạo tài khoản</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            placeholder="Họ và tên"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="field"
          />
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
            autoComplete="new-password"
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          <div className="flex gap-2 rounded border border-ink/20 p-1">
            {(['CANDIDATE', 'HR'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                  role === r ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink'
                }`}
              >
                {r === 'CANDIDATE' ? 'Ứng viên' : 'Nhà tuyển dụng'}
              </button>
            ))}
          </div>
          {error && <p className="text-sm font-medium text-rust">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Đang tạo…' : 'Đăng ký'}
          </button>
          <p className="text-center text-sm text-ink/50">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-moss transition-colors duration-200 hover:text-ink">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
