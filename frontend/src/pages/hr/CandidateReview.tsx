import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MousePointerClick, Search, SlidersHorizontal } from 'lucide-react';
import ScoreRing from '../../components/ui/ScoreRing';
import SkillChips from '../../components/ui/SkillChips';
import { JobStatePill, ReviewPill } from '../../components/ui/StatusPill';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { useCandidates, useMyJobs } from '../../hooks/queries';
import {
  countByReview,
  defaultFilters,
  filterCandidates,
  type CandidateFilters,
  type ReviewFilter,
} from '../../lib/candidates';
import { formatRelative } from '../../lib/format';
import { parseSkills } from '../../lib/skills';
import type { CandidateMatch } from '../../types';
import CandidateDetail from './CandidateDetail';

const reviewTabs: { value: ReviewFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NEW', label: 'Chưa xử lý' },
  { value: 'SHORTLISTED', label: 'Shortlist' },
  { value: 'REJECTED', label: 'Đã loại' },
];

function CandidateRow({ c, rank, selected, onSelect }: {
  c: CandidateMatch; rank: number | null; selected: boolean; onSelect: () => void;
}) {
  const matchedCount = parseSkills(c.matchedSkills).length;
  return (
    <li>
      <button
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
          selected
            ? 'border-moss/40 bg-moss/[0.07] shadow-card'
            : 'border-transparent hover:border-ink/10 hover:bg-surface'
        } ${c.reviewStatus === 'REJECTED' ? 'opacity-55' : ''}`}
      >
        <span className="w-6 text-center font-display text-lg italic text-ink/30">{rank ?? '·'}</span>
        <ScoreRing score={c.score} status={c.status} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{c.candidateName}</span>
          <span className="block truncate text-xs text-ink/50">
            {c.status === 'PROCESSED'
              ? `${matchedCount} kỹ năng khớp · ${formatRelative(c.uploadedAt)}`
              : c.status === 'PENDING'
                ? 'AI đang chấm…'
                : 'Lỗi đọc CV'}
          </span>
        </span>
        {c.reviewStatus !== 'NEW' && <ReviewPill status={c.reviewStatus} />}
      </button>
    </li>
  );
}

export default function CandidateReview() {
  const jobId = Number(useParams().jobId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = Number(searchParams.get('cv')) || null;
  const [filters, setFilters] = useState<CandidateFilters>(defaultFilters);

  const myJobs = useMyJobs();
  const candidates = useCandidates(Number.isFinite(jobId) ? jobId : null);
  const job = myJobs.data?.find((j) => j.id === jobId);

  const all = useMemo(() => candidates.data ?? [], [candidates.data]);
  const visible = useMemo(() => filterCandidates(all, filters), [all, filters]);
  const counts = useMemo(() => countByReview(all), [all]);
  const selected = all.find((c) => c.cvId === selectedId) ?? null;
  const requiredSkills = parseSkills(job?.requiredSkills);

  const select = (cvId: number | null) =>
    setSearchParams(cvId ? { cv: String(cvId) } : {}, { replace: true });
  const update = (patch: Partial<CandidateFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const filtersActive = filters.query !== '' || filters.minScore > 0 || filters.review !== 'ALL';

  if (myJobs.isSuccess && !job) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState message="Không tìm thấy tin này trong danh sách tin của bạn" />
        <Link to="/hr" className="btn-ghost mt-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Về tổng quan</Link>
      </div>
    );
  }

  return (
    <div>
      {/* ---- Tieu de + chuyen tin ---- */}
      <Link to="/hr" className="btn-ghost -ml-3 mb-4">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tổng quan
      </Link>
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 animate-fade-up">
          {job ? (
            <>
              <div className="flex items-center gap-2">
                <p className="eyebrow">Xét duyệt ứng viên</p>
                <JobStatePill active={job.active} />
              </div>
              <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-ink/50">AI chấm theo:</span>
                <SkillChips skills={requiredSkills} size="sm" />
              </div>
            </>
          ) : (
            <Skeleton className="h-20 w-80" />
          )}
        </div>
        {myJobs.data && myJobs.data.length > 1 && (
          <div className="shrink-0">
            <label htmlFor="job-switch" className="field-label text-xs">Chuyển sang tin khác</label>
            <select
              id="job-switch"
              value={jobId}
              onChange={(e) => navigate(`/hr/jobs/${e.target.value}`)}
              className="input w-full cursor-pointer py-2 sm:w-80"
            >
              {myJobs.data.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}{j.active ? '' : ' (đã đóng)'} — {j.applicantCount} hồ sơ
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* ---- Bo loc ---- */}
      <div className="card mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <div className="relative w-full sm:w-56">
          <label htmlFor="cand-search" className="sr-only">Tìm ứng viên</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
          <input
            id="cand-search"
            type="search"
            placeholder="Tên, email, kỹ năng…"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            className="input rounded-full py-2 pl-10"
          />
        </div>
        <div role="group" aria-label="Lọc theo trạng thái xử lý" className="flex flex-wrap gap-1 whitespace-nowrap">
          {reviewTabs.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ review: value })}
              aria-pressed={filters.review === value}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                filters.review === value ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-ink/[0.05] hover:text-ink'
              }`}
            >
              {label} <span className="opacity-55">{counts[value]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 lg:ml-auto">
          <label className="flex items-center gap-3 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-ink/45" aria-hidden="true" />
            <span className="whitespace-nowrap text-ink/60">Điểm từ</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.minScore}
              onChange={(e) => update({ minScore: Number(e.target.value) })}
              className="w-24 accent-moss"
              aria-valuetext={`${filters.minScore} điểm`}
            />
            <span className="w-8 font-display text-base font-semibold">{filters.minScore}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Sắp xếp</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as CandidateFilters['sort'] })}
              className="input w-auto cursor-pointer rounded-full py-1.5"
            >
              <option value="score">Điểm cao nhất</option>
              <option value="recent">Mới nộp nhất</option>
            </select>
          </label>
        </div>
      </div>

      {/* ---- Danh sach + chi tiet ---- */}
      {candidates.isError ? (
        <ErrorState message="Không tải được danh sách ứng viên" onRetry={() => candidates.refetch()} />
      ) : candidates.isPending ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          <Skeleton className="hidden h-[480px] rounded-2xl lg:block" />
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          title="Chưa có ai nộp CV"
          description={job?.active ? 'Khi ứng viên nộp CV, AI sẽ chấm và xếp hạng họ ở đây.' : 'Tin này đã đóng. Mở lại ở trang tổng quan để nhận thêm hồ sơ.'}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div>
            <p className="mb-2 px-1 text-xs text-ink/50" aria-live="polite">
              Hiển thị {visible.length}/{all.length} hồ sơ
            </p>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/55">
                Không hồ sơ nào khớp bộ lọc.
                {filtersActive && (
                  <button onClick={() => setFilters(defaultFilters)} className="btn-ghost mt-2 w-full">Xoá bộ lọc</button>
                )}
              </div>
            ) : (
              <ol className="space-y-1">
                {visible.map((c, i) => (
                  <CandidateRow
                    key={c.cvId}
                    c={c}
                    rank={filters.sort === 'score' && c.score !== null ? i + 1 : null}
                    selected={c.cvId === selectedId}
                    onSelect={() => select(c.cvId)}
                  />
                ))}
              </ol>
            )}
          </div>

          {/* Mobile: panel chi tiet phu toan man hinh; desktop: cot ben phai dinh khi cuon */}
          <div
            className={`${selected ? 'fixed inset-0 z-40 overflow-y-auto bg-paper p-4' : 'hidden'} lg:static lg:z-auto lg:block lg:overflow-visible lg:bg-transparent lg:p-0`}
          >
            <div className="lg:sticky lg:top-24">
              {selected ? (
                <CandidateDetail
                  key={selected.cvId}
                  candidate={selected}
                  jobId={jobId}
                  requiredSkills={requiredSkills}
                  onClose={() => select(null)}
                />
              ) : (
                <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 text-center">
                  <MousePointerClick className="h-8 w-8 text-ink/25" aria-hidden="true" />
                  <p className="mt-3 font-display text-xl">Chọn một ứng viên</p>
                  <p className="mt-1 text-sm text-ink/50">để xem điểm, kỹ năng và nhận xét của AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
