import { isAxiosError } from 'axios';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, UserRound } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/ui/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../lib/errors';
import { homeOf } from '../lib/navigation';
import { register } from '../services/authService';
import type { Role } from '../types';

// Khop RegisterRequest phia backend
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;
/** Gia tri mac dinh cua app.auth.hr-invite-code - chi hien o moi truong dev. */
const DEV_INVITE_CODE = 'HR-DEMO-2026';

type Field = 'fullName' | 'email' | 'password' | 'hrInviteCode';

const roles: { value: Role; label: string; hint: string; Icon: typeof Briefcase }[] = [
  { value: 'CANDIDATE', label: 'Ứng viên', hint: 'Tìm việc & nộp CV', Icon: UserRound },
  { value: 'HR', label: 'Nhà tuyển dụng', hint: 'Đăng tin & sàng lọc', Icon: Briefcase },
];

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1.5 text-xs font-medium text-clay">{message}</p> : null;
}

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CANDIDATE');
  const [inviteCode, setInviteCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const clearError = (field: Field) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const chooseRole = (next: Role) => {
    setRole(next);
    // Khong giu ma moi da go khi chuyen sang ung vien (o bi an nhung gia tri van con)
    if (next !== 'HR') setInviteCode('');
    clearError('hrInviteCode');
  };

  const validate = (): Partial<Record<Field, string>> => {
    const errors: Partial<Record<Field, string>> = {};
    if (!fullName.trim()) errors.fullName = 'Nhập họ và tên.';
    if (!email.trim()) errors.email = 'Nhập email.';
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
      errors.password = `Mật khẩu phải dài từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự.`;
    }
    if (role === 'HR' && !inviteCode.trim()) errors.hrInviteCode = 'Tài khoản nhà tuyển dụng cần mã mời.';
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clientErrors = validate();
    setFieldErrors(clientErrors);
    setError('');
    if (Object.keys(clientErrors).length > 0) return;
    setLoading(true);
    try {
      const user = await register(fullName.trim(), email.trim(), password, role, inviteCode.trim());
      setUser(user);
      navigate(homeOf(user.role));
    } catch (err) {
      const serverFieldErrors = getFieldErrors(err) as Partial<Record<Field, string>>;
      // 409 khi dang ky = email da ton tai (backend khong gan vao truong nao) -> hien ngay duoi o Email
      if (isAxiosError(err) && err.response?.status === 409 && !serverFieldErrors.email) {
        serverFieldErrors.email = getErrorMessage(err, 'Email này đã được đăng ký.');
      }
      setFieldErrors(serverFieldErrors);
      // Loi da hien dung o thi khong lap lai o duoi form
      if (Object.keys(serverFieldErrors).length === 0) setError(getErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const invalid = (field: Field) => ({
    'aria-invalid': !!fieldErrors[field],
    'aria-describedby': fieldErrors[field] ? `reg-${field}-error` : undefined,
  });

  return (
    <AuthLayout
      title={<>Tạo tài khoản <span className="accent-italic">mới</span></>}
      subtitle="Chỉ mất chưa đến một phút."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset>
          <legend className="field-label">Bạn là</legend>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(({ value, label, hint, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseRole(value)}
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
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              clearError('fullName');
            }}
            className="input"
            {...invalid('fullName')}
          />
          <FieldError id="reg-fullName-error" message={fieldErrors.fullName} />
        </div>
        <div>
          <label htmlFor="reg-email" className="field-label">Email</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError('email');
            }}
            className="input"
            {...invalid('email')}
          />
          <FieldError id="reg-email-error" message={fieldErrors.email} />
        </div>
        <div>
          <label htmlFor="reg-password" className="field-label">Mật khẩu</label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            maxLength={MAX_PASSWORD}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            {...invalid('password')}
            aria-describedby={fieldErrors.password ? 'reg-password-error' : 'reg-password-hint'}
          />
          {fieldErrors.password ? (
            <FieldError id="reg-password-error" message={fieldErrors.password} />
          ) : (
            <p id="reg-password-hint" className={`mt-1.5 text-xs ${password.length >= MIN_PASSWORD ? 'text-moss' : 'text-ink/50'}`}>
              {password.length >= MIN_PASSWORD
                ? '✓ Đủ độ dài'
                : `Tối thiểu ${MIN_PASSWORD} ký tự${password ? ` · còn ${MIN_PASSWORD - password.length}` : ''}`}
            </p>
          )}
        </div>
        {role === 'HR' && (
          <div>
            <label htmlFor="reg-invite" className="field-label">Mã mời nhà tuyển dụng</label>
            <input
              id="reg-invite"
              autoComplete="off"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                clearError('hrInviteCode');
              }}
              className="input"
              {...invalid('hrInviteCode')}
              aria-describedby={fieldErrors.hrInviteCode ? 'reg-hrInviteCode-error' : 'reg-invite-hint'}
            />
            {fieldErrors.hrInviteCode ? (
              <FieldError id="reg-hrInviteCode-error" message={fieldErrors.hrInviteCode} />
            ) : (
              <p id="reg-invite-hint" className="mt-1.5 text-xs text-ink/50">
                Tài khoản nhà tuyển dụng xem được CV của ứng viên nên cần mã mời. Xin mã từ quản trị viên của công ty bạn.
                {import.meta.env.DEV && (
                  <>
                    {' '}Môi trường dev:{' '}
                    <button
                      type="button"
                      onClick={() => setInviteCode(DEV_INVITE_CODE)}
                      className="font-semibold text-moss underline-offset-2 hover:underline"
                    >
                      dùng {DEV_INVITE_CODE}
                    </button>
                  </>
                )}
              </p>
            )}
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
