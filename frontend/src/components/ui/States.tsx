import type { ReactNode } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

/** Minh hoa nho: to giay rong nam tren cai sang - dung cho moi trang thai "chua co gi". */
function EmptyArt() {
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-32" aria-hidden="true">
      <g className="animate-float" style={{ ['--r' as string]: '-6deg' }}>
        <rect x="38" y="6" width="40" height="50" rx="5" className="fill-surface stroke-ink/20" strokeWidth="1.5" />
        <path d="M46 20h24M46 28h18M46 36h22" className="stroke-ink/15" strokeWidth="3" strokeLinecap="round" />
      </g>
      <path d="M18 60h84l-12 20a6 6 0 0 1-5 3H35a6 6 0 0 1-5-3z" className="fill-mint stroke-moss/40" strokeWidth="1.5" />
      <path d="M32 67h56M38 74h44" className="stroke-moss/30" strokeWidth="1.5" strokeDasharray="2 4" />
    </svg>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink/15 px-6 py-12 text-center">
      <EmptyArt />
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink/60">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-clay/25 bg-clay/5 px-6 py-10 text-center">
      <WifiOff className="h-8 w-8 text-clay" aria-hidden="true" />
      <p className="mt-3 font-semibold">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-4">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Thử lại
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function CardSkeletons({ count = 3, className = 'h-40' }: { count?: number; className?: string }) {
  return (
    <div className="contents" role="status" aria-label="Đang tải">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`rounded-2xl ${className}`} />
      ))}
    </div>
  );
}
