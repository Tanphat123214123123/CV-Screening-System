import { Ban, Circle, Star } from 'lucide-react';
import type { ReviewStatus } from '../../types';

const review: Record<ReviewStatus, { label: string; className: string; Icon: typeof Star }> = {
  NEW: { label: 'Chưa xử lý', className: 'bg-ink/[0.05] text-ink/60', Icon: Circle },
  SHORTLISTED: { label: 'Shortlist', className: 'bg-amber/15 text-amber', Icon: Star },
  REJECTED: { label: 'Đã loại', className: 'bg-clay/10 text-clay', Icon: Ban },
};

export function ReviewPill({ status }: { status: ReviewStatus }) {
  const { label, className, Icon } = review[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      <Icon className={`h-3 w-3 ${status === 'SHORTLISTED' ? 'fill-current' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function JobStatePill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-semibold text-moss">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-moss" />
      </span>
      Đang tuyển
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-xs font-semibold text-ink/50">
      Đã đóng
    </span>
  );
}
