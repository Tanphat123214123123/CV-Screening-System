import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <svg viewBox="0 0 200 120" className="w-56" aria-hidden="true">
        <path d="M20 30h160l-22 44a10 10 0 0 1-9 6H51a10 10 0 0 1-9-6z" className="fill-mint stroke-moss" strokeWidth="2" />
        <path d="M40 42h120M48 56h104" className="stroke-moss/35" strokeWidth="2" strokeDasharray="3 6" />
        <circle cx="100" cy="102" r="7" className="animate-bounce fill-amber" />
      </svg>
      <p className="mt-6 font-display text-7xl font-semibold italic text-ink/15">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Trang này đã lọt qua sàng.</h1>
      <p className="mt-2 text-ink/60">Đường dẫn không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/" className="btn-primary mt-8">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Về trang chủ
      </Link>
    </div>
  );
}
