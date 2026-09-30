import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, Sparkles } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ScoreRing from '../../components/ui/ScoreRing';
import SkillChips from '../../components/ui/SkillChips';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/ui/States';
import { useJobs, useMyApplications } from '../../hooks/queries';
import { formatRelative } from '../../lib/format';
import { bandLabel, scoreBand } from '../../lib/score';
import { parseSkills, restoreCase } from '../../lib/skills';
import type { MyApplication } from '../../types';

function ApplicationCard({ app, index, reference }: { app: MyApplication; index: number; reference: string[] }) {
  const matched = restoreCase(parseSkills(app.matchedSkills), reference);
  const missing = restoreCase(parseSkills(app.missingSkills), reference);

  return (
    <li className="card flex animate-fade-up flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <ScoreRing score={app.score} status={app.status} size="md" />

      <div className="min-w-0 flex-1">
        <Link to={`/jobs/${app.jobId}`} className="text-lg font-semibold hover:text-moss">
          {app.jobTitle}
        </Link>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{app.fileName}</span> · {formatRelative(app.uploadedAt)}
        </p>

        {app.status === 'PENDING' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-ink/60">
            <Sparkles className="h-4 w-4 animate-pulse text-amber" aria-hidden="true" />
            AI đang đọc CV của bạn…
            <span className="skeleton h-1.5 w-24 rounded-full" />
          </div>
        )}

        {app.status === 'FAILED' && (
          <p className="mt-3 flex items-start gap-2 text-sm text-clay">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            AI không đọc được file này. Nếu CV là ảnh scan, hãy xuất lại sang PDF có chữ.
          </p>
        )}

        {app.status === 'PROCESSED' && app.score !== null && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-semibold">{bandLabel[scoreBand(app.score)]}</p>
            {matched.length > 0 && <SkillChips skills={matched} variant="matched" size="sm" />}
            {missing.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-ink/55">Nên bổ sung:</span>
                <SkillChips skills={missing} variant="missing" size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function MyApplications() {
  const { data, isPending, isError, refetch } = useMyApplications();
  // Chi de hien ky nang dung cach viet cua tin ("Spring Boot" thay vi "spring boot")
  const jobs = useJobs();
  const skillsByJob = new Map(jobs.data?.map((j) => [j.id, parseSkills(j.requiredSkills)]) ?? []);
  const scored = data?.filter((a) => a.score !== null) ?? [];
  const best = scored.length ? Math.max(...scored.map((a) => a.score!)) : null;

  return (
    <>
      <PageHeader
        eyebrow="Đơn ứng tuyển"
        title={<>Hành trình của <span className="accent-italic">bạn</span></>}
        description="Kết quả tự cập nhật khi AI chấm xong — không cần tải lại trang."
        actions={
          data && data.length > 0 ? (
            <div className="card flex gap-6 px-5 py-3">
              <div>
                <p className="font-display text-2xl font-semibold">{data.length}</p>
                <p className="text-xs text-ink/50">đơn đã nộp</p>
              </div>
              {best !== null && (
                <div>
                  <p className="font-display text-2xl font-semibold text-moss">{best}</p>
                  <p className="text-xs text-ink/50">điểm cao nhất</p>
                </div>
              )}
            </div>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState message="Không tải được đơn ứng tuyển" onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="grid gap-4">
          <CardSkeletons count={3} className="h-32" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="Bạn chưa nộp CV nào"
          description="Chọn một vị trí phù hợp và gửi CV — AI sẽ chấm điểm trong vài giây."
          action={<Link to="/jobs" className="btn-primary">Khám phá việc làm</Link>}
        />
      ) : (
        <ul className="grid gap-4">
          {data.map((app, i) => (
            <ApplicationCard key={app.cvId} app={app} index={i} reference={skillsByJob.get(app.jobId) ?? []} />
          ))}
        </ul>
      )}
    </>
  );
}
