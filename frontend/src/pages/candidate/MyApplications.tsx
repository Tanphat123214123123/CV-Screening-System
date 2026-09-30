import { Link } from 'react-router-dom';
import { ArrowRight, FileText, RotateCcw } from 'lucide-react';
import { FitMeter, StageCard } from '../../components/ui/CandidateStatus';
import PageHeader from '../../components/ui/PageHeader';
import SkillChips from '../../components/ui/SkillChips';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/ui/States';
import { useJobs, useMyApplications } from '../../hooks/queries';
import { formatRelative } from '../../lib/format';
import { parseSkills, restoreCase } from '../../lib/skills';
import type { MyApplication } from '../../types';

function ApplicationCard({ app, index, reference }: { app: MyApplication; index: number; reference: string[] }) {
  const matched = restoreCase(parseSkills(app.matchedSkills), reference);
  const missing = restoreCase(parseSkills(app.missingSkills), reference);

  return (
    <li
      className={`card animate-fade-up p-5 sm:p-6 ${app.reviewStatus === 'SHORTLISTED' && app.status === 'PROCESSED' ? 'border-moss/30' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link to={`/jobs/${app.jobId}`} className="text-lg font-semibold hover:text-moss">
            {app.jobTitle}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">{app.fileName}</span> · {formatRelative(app.uploadedAt)}
          </p>
        </div>
        {app.status === 'PROCESSED' && <FitMeter level={app.fitLevel} />}
      </div>

      <div className="mt-4">
        <StageCard app={app} />
      </div>

      {app.status === 'FAILED' && (
        <Link to={`/jobs/${app.jobId}`} className="btn-primary mt-4">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Nộp lại CV
        </Link>
      )}

      {app.status === 'PROCESSED' && (matched.length > 0 || missing.length > 0) && (
        <div className="mt-4 space-y-2 border-t border-ink/[0.07] pt-4">
          {matched.length > 0 && <SkillChips skills={matched} variant="matched" size="sm" />}
          {missing.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink/55">Nên bổ sung:</span>
              <SkillChips skills={missing} variant="missing" size="sm" />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function MyApplications() {
  const { data, isPending, isError, refetch } = useMyApplications();
  // Chi de hien ky nang dung cach viet cua tin ("Spring Boot" thay vi "spring boot")
  const jobs = useJobs();
  const skillsByJob = new Map(jobs.data?.map((j) => [j.id, parseSkills(j.requiredSkills)]) ?? []);
  const shortlisted = data?.filter((a) => a.status === 'PROCESSED' && a.reviewStatus === 'SHORTLISTED').length ?? 0;
  const needsAction = data?.filter((a) => a.status === 'FAILED').length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Đơn ứng tuyển"
        title={<>Hành trình của <span className="accent-italic">bạn</span></>}
        description="Trạng thái tự cập nhật khi AI đọc xong CV và khi nhà tuyển dụng xét duyệt."
        actions={
          data && data.length > 0 ? (
            <div className="card flex gap-6 px-5 py-3">
              <div>
                <p className="font-display text-2xl font-semibold">{data.length}</p>
                <p className="text-xs text-ink/50">đơn đã nộp</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-moss">{shortlisted}</p>
                <p className="text-xs text-ink/50">được chọn</p>
              </div>
              {needsAction > 0 && (
                <div>
                  <p className="font-display text-2xl font-semibold text-clay">{needsAction}</p>
                  <p className="text-xs text-ink/50">cần nộp lại</p>
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
          description="Chọn một vị trí phù hợp và gửi CV — AI sẽ phân tích trong vài giây."
          action={<Link to="/jobs" className="btn-primary">Khám phá việc làm <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
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
