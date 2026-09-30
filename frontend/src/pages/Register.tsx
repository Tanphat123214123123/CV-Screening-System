import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, UserRound } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { register } from '../services/authService';
import type { Role } from '../types';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

const roles: { value: Role; label: string; hint: string; Icon: typeof Briefcase }[] = [
  { value: 'CANDIDATE', label: 'Ứng viên', hint: 'Tìm việc & nộp CV', Icon: UserRound },
  { value: 'HR', label: 'Nhà tuyển dụng', hint: 'Đăng tin & sàng lọc', Icon: Briefcase },
];

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CANDIDATE');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Khop RegisterRequest phia backend: 8-72 ky tu
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
      setError(`Mật khẩu phải dài từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự.`);
      return;
    }
    if (role === 'HR' && !inviteCode.trim()) {
      setError('Tài khoản nhà tuyển dụng cần mã mời.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(fullName.trim(), email.trim(), password, role, inviteCode.trim());
      setUser(user);
      navigate(user.role === 'HR' ? '/hr' : '/jobs');
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={<>Tạo tài khoản <span className="accent-italic">mới</span></>}
      subtitle="Chỉ mất chưa đến một phút."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="field-label">Bạn là</legend>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(({ value, label, hint, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={`rounded-2xl border-2 p-3.5 text-left transition ${
                  role === value ? 'border-moss bg-moss/5' : 'border-ink/10 hover:border-ink/25'
                }`}
              >
                <Icon className={`h-5 w-5 ${role === value ? 'text-moss' : 'text-ink/40'}`} aria-hidden="true" />
                <span className="mt-2 block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-ink/50">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="reg-name" className="field-label">Họ và tên</label>
          <input
            id="reg-name"
            required
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="field-label">Email</label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="field-label">Mật khẩu</label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={MIN_PASSWORD}
            maxLength={MAX_PASSWORD}
            autoComplete="new-password"
            aria-describedby="reg-password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <p id="reg-password-hint" className="mt-1.5 text-xs text-ink/50">Tối thiểu {MIN_PASSWORD} ký tự.</p>
        </div>
        {role === 'HR' && (
          <div>
            <label htmlFor="reg-invite" className="field-label">Mã mời nhà tuyển dụng</label>
            <input
              id="reg-invite"
              required
              autoComplete="off"
              aria-describedby="reg-invite-hint"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="input"
            />
            <p id="reg-invite-hint" className="mt-1.5 text-xs text-ink/50">
              Do quản trị viên hệ thống cấp. Tài khoản nhà tuyển dụng xem được CV của ứng viên nên cần xác minh.
            </p>
          </div>
        )}
        {error && <p role="alert" className="text-sm font-medium text-clay">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Đang tạo…' : <>Đăng ký <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
        </button>
      </form>
      <p className="mt-8 text-sm text-ink/60">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-moss underline-offset-4 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
