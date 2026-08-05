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
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-1 text-2xl font-extrabold">Đăng nhập</h1>
      <p className="mb-6 text-sm text-ink/60">
        Tài khoản demo: hr@demo.com hoặc candidate@demo.com — mật khẩu 123456
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
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
          autoComplete="current-password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-moss focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-moss py-2 font-semibold text-white hover:bg-ink disabled:opacity-50"
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        <p className="text-center text-sm text-ink/60">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-moss hover:underline">
            Đăng ký
          </Link>
        </p>
      </form>
    </div>
  );
}
