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
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-6 text-2xl font-extrabold">Tạo tài khoản</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <input
          placeholder="Họ và tên"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-moss focus:outline-none"
        />
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-moss focus:outline-none"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Mật khẩu (tối thiểu 6 ký tự)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-moss focus:outline-none"
        />
        <div className="flex gap-2">
          {(['CANDIDATE', 'HR'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                role === r ? 'border-moss bg-mint text-moss' : 'border-ink/20 text-ink/60'
              }`}
            >
              {r === 'CANDIDATE' ? 'Ứng viên' : 'Nhà tuyển dụng'}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-moss py-2 font-semibold text-white hover:bg-ink disabled:opacity-50"
        >
          {loading ? 'Đang tạo…' : 'Đăng ký'}
        </button>
        <p className="text-center text-sm text-ink/60">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-moss hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
