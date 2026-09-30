import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CalendarDays, Lightbulb, Lock, MapPin, Send } from 'lucide-react';
import DropZone from '../../components/ui/DropZone';
import ScoreRing from '../../components/ui/ScoreRing';
import SkillChips from '../../components/ui/SkillChips';
import { JobStatePill } from '../../components/ui/StatusPill';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { useJob, useMyApplications, useUploadCv } from '../../hooks/queries';
import { getErrorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';
import { parseSkills, restoreCase } from '../../lib/skills';
import type { Job, MyApplication } from '../../types';

function AppliedPanel({ application, requiredSkills }: { application: MyApplication; requiredSkills: string[] }) {
  const missing = restoreCase(parseSkills(application.missingSkills), requiredSkills);
  const statusText = {
    PENDING: 'AI đang đọc CV của bạn…',
    PROCESSED: 'AI đã chấm xong',
    FAILED: 'AI không đọc được file này',
  }[application.status];

  return (
    <div className="text-center">
      <p className="eyebrow">Bạn đã ứng tuyển</p>
      <div className="mt-5 flex justify-center">
        <ScoreRing score={application.score} status={application.status} size="lg" showLabel />
      </div>
      <p className="mt-4 font-semibold">{statusText}</p>
      <p className="text-xs text-ink/50">{application.fileName} · {formatDate(application.uploadedAt)}</p>
      {application.status === 'PROCESSED' && (
        <div className="mt-5 space-y-3 text-left">
          {missing.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink/60">Nên bổ sung</p>
              <SkillChips skills={missing} variant="missing" size="sm" />
            </div>
          )}
        </div>
      )}
      <Link to="/my-applications" className="btn-outline mt-6 w-full">Xem tất cả đơn của tôi</Link>
    </div>
  );
}

function ApplyPanel({ job }: { job: Job }) {
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadCv();

  const submit = () => {
    if (!file) return;
    upload.mutate(
      { jobId: job.id, file },
      {
        onSuccess: () => {
          toast.success('Đã gửi CV!', { description: 'AI đang phân tích, kết quả sẽ hiện trong giây lát.' });
          setFile(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Nộp CV thất bại')),
      },
    );
  };

  return (
    <div>
      <p className="eyebrow">Ứng tuyển</p>
      <h2 className="mb-5 mt-1 text-2xl font-semibold">Gửi CV của bạn</h2>
      <DropZone file={file} onFileChange={setFile} disabled={upload.isPending} />
      <button onClick={submit} disabled={!file || upload.isPending} className="btn-primary mt-4 w-full py-3">
        {upload.isPending ? 'Đang tải lên…' : <><Send className="h-4 w-4" aria-hidden="true" /> Nộp CV</>}
      </button>
      <p className="mt-5 flex gap-2 rounded-xl bg-amber/10 p-3 text-xs text-ink/70">
        <Lightbulb className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
        Ghi kỹ năng trong CV đúng tên như trong tin (vd “Spring Boot”) để AI nhận diện chính xác. Mỗi vị trí chỉ nộp được một lần.
      </p>
    </div>
  );
}

export default function JobDetail() {
  const id = Number(useParams().id);
  const job = useJob(id);
  const applications = useMyApplications();
  const application = applications.data?.find((a) => a.jobId === id);

  if (job.isError) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState message="Không tìm thấy tin tuyển dụng này" />
        <Link to="/jobs" className="btn-ghost mt-4">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/jobs" className="btn-ghost -ml-3 mb-6">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tất cả việc làm
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <article className="animate-fade-up">
          {job.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <JobStatePill active={job.data.active} />
              <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{job.data.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/55">
                {job.data.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> {job.data.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Đăng ngày {formatDate(job.data.createdAt)}
                </span>
              </div>

              <section className="mt-10">
                <h2 className="text-xl font-semibold">Kỹ năng yêu cầu</h2>
                <p className="mb-3 text-sm text-ink/55">AI dùng đúng danh sách này để chấm điểm CV.</p>
                <SkillChips skills={parseSkills(job.data.requiredSkills)} />
              </section>

              <section className="mt-10">
                <h2 className="text-xl font-semibold">Mô tả công việc</h2>
                <div className="mt-3 whitespace-pre-line leading-relaxed text-ink/75">{job.data.description}</div>
              </section>
            </>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            {job.isPending || applications.isPending ? (
              <Skeleton className="h-72 w-full" />
            ) : application ? (
              <AppliedPanel application={application} requiredSkills={parseSkills(job.data.requiredSkills)} />
            ) : !job.data.active ? (
              <div className="py-6 text-center">
                <Lock className="mx-auto h-8 w-8 text-ink/30" aria-hidden="true" />
                <p className="mt-3 font-semibold">Tin này đã ngừng nhận hồ sơ</p>
                <Link to="/jobs" className="btn-outline mt-5">Xem vị trí khác</Link>
              </div>
            ) : (
              <ApplyPanel job={job.data} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
