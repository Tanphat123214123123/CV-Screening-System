import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, MapPin, Search } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SkillChips from '../../components/ui/SkillChips';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/ui/States';
import { useJobs, useMyApplications } from '../../hooks/queries';
import { formatRelative } from '../../lib/format';
import { parseSkills } from '../../lib/skills';
import type { Job } from '../../types';

function JobCard({ job, applied, index }: { job: Job; applied: boolean; index: number }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className={`card group relative flex animate-fade-up flex-col p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lift ${
        applied ? 'border-moss/30' : ''
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      {applied && (
        <span className="absolute -right-2 -top-3 inline-flex rotate-3 items-center gap-1 rounded-full bg-moss px-3 py-1 text-xs font-bold text-paper shadow-card">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Đã nộp
        </span>
      )}
      <div className="flex items-center gap-3 text-xs text-ink/50">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {job.location}
          </span>
        )}
        <span>{formatRelative(job.createdAt)}</span>
      </div>
      <h2 className="mt-2 text-xl font-semibold leading-snug group-hover:text-moss">{job.title}</h2>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink/60">{job.description}</p>
      <div className="mt-4">
        <SkillChips skills={parseSkills(job.requiredSkills)} max={4} size="sm" />
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-moss">
        {applied ? 'Xem kết quả' : 'Xem & ứng tuyển'}
        <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function JobBoard() {
  const jobs = useJobs();
  const applications = useMyApplications();
  const [query, setQuery] = useState('');

  const appliedJobIds = useMemo(
    () => new Set(applications.data?.map((a) => a.jobId) ?? []),
    [applications.data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!jobs.data || !q) return jobs.data ?? [];
    return jobs.data.filter((job) =>
      `${job.title} ${job.requiredSkills} ${job.location ?? ''}`.toLowerCase().includes(q),
    );
  }, [jobs.data, query]);

  return (
    <>
      <PageHeader
        eyebrow="Việc làm"
        title={<>Tìm vị trí <span className="accent-italic">hợp</span> với bạn</>}
        description="Nộp CV một lần — AI sẽ chấm độ phù hợp và cho bạn biết kỹ năng nào nên bổ sung."
      />

      <div className="relative mb-8 max-w-md">
        <label htmlFor="job-search" className="sr-only">Tìm việc làm</label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
        <input
          id="job-search"
          type="search"
          placeholder="Tìm theo vị trí, kỹ năng, địa điểm…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input rounded-full pl-10"
        />
      </div>

      {jobs.isError ? (
        <ErrorState message="Không tải được danh sách việc làm" onRetry={() => jobs.refetch()} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.isPending ? (
            <CardSkeletons count={6} className="h-60" />
          ) : filtered.length > 0 ? (
            filtered.map((job, i) => (
              <JobCard key={job.id} job={job} applied={appliedJobIds.has(job.id)} index={i} />
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title={query ? 'Không có vị trí nào khớp' : 'Chưa có tin tuyển dụng'}
                description={query ? 'Thử từ khoá khác, ví dụ “Java” hoặc “Hà Nội”.' : 'Quay lại sau nhé — tin mới sẽ xuất hiện ở đây.'}
                action={query ? <button onClick={() => setQuery('')} className="btn-outline">Xoá tìm kiếm</button> : undefined}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
