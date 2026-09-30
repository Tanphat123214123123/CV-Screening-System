import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CalendarDays, FileText, Lightbulb, Lock, MapPin, Send } from 'lucide-react';
import DropZone from '../../components/ui/DropZone';
import { FitMeter, StageCard } from '../../components/ui/CandidateStatus';
import SkillChips from '../../components/ui/SkillChips';
import { JobStatePill } from '../../components/ui/StatusPill';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { useJob, useMyApplications, useUploadCv } from '../../hooks/queries';
import { getErrorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';
import { parseSkills, restoreCase } from '../../lib/skills';
import type { Job, MyApplication } from '../../types';

function AppliedPanel({ application, job, requiredSkills }: {
  application: MyApplication;
  job: Job;
  requiredSkills: string[];
}) {
  const matched = restoreCase(parseSkills(application.matchedSkills), requiredSkills);
  const missing = restoreCase(parseSkills(application.missingSkills), requiredSkills);

  return (
    <div>
      <p className="eyebrow">Hồ sơ của bạn</p>
      <div className="mt-4">
        <StageCard app={application} />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate">{application.fileName}</span> · nộp {formatDate(application.uploadedAt)}
      </p>

      {application.status === 'PROCESSED' && (
        <div className="mt-5 space-y-4 border-t border-ink/[0.07] pt-5">
          <FitMeter level={application.fitLevel} />
          {matched.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink/60">AI tìm thấy trong CV</p>
              <SkillChips skills={matched} variant="matched" size="sm" />
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink/60">Nên bổ sung / ghi rõ hơn trong CV</p>
              <SkillChips skills={missing} variant="missing" size="sm" />
            </div>
          )}
        </div>
      )}

      {/* CV khong doc duoc: cho nop lai ngay tai day thay vi ngo cut */}
      {application.status === 'FAILED' && job.active && (
        <div className="mt-5 border-t border-ink/[0.07] pt-5">
          <ApplyPanel job={job} resubmit />
        </div>
      )}

      <Link to="/my-applications" className="btn-outline mt-6 w-full">Xem tất cả đơn của tôi</Link>
    </div>
  );
}

function ApplyPanel({ job, resubmit = false }: { job: Job; resubmit?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const upload = useUploadCv();

  const submit = () => {
    if (!file) return;
    setProgress(0);
    upload.mutate(
      { jobId: job.id, file, onProgress: setProgress },
      {
        onSuccess: (res) => {
          toast.success(resubmit ? 'Đã gửi CV mới!' : 'Đã gửi CV!', { description: res.message });
          setFile(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Nộp CV thất bại')),
        onSettled: () => setProgress(null),
      },
    );
  };

  return (
    <div>
      {resubmit ? (
        <h2 className="mb-4 text-lg font-semibold">Nộp lại CV</h2>
      ) : (
        <>
          <p className="eyebrow">Ứng tuyển</p>
          <h2 className="mb-5 mt-1 text-2xl font-semibold">Gửi CV của bạn</h2>
        </>
      )}
      <DropZone file={file} onFileChange={setFile} disabled={upload.isPending} />

      {progress !== null && (
        <div className="mt-4" aria-live="polite">
          <div className="mb-1 flex justify-between text-xs text-ink/60">
            <span>{progress < 100 ? 'Đang tải lên…' : 'Đang lưu hồ sơ…'}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-ink/[0.08]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến trình tải CV lên"
          >
            <div className="h-full rounded-full bg-moss transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button onClick={submit} disabled={!file || upload.isPending} className="btn-primary mt-4 w-full py-3">
        {upload.isPending ? 'Đang gửi…' : <><Send className="h-4 w-4" aria-hidden="true" /> {resubmit ? 'Gửi CV mới' : 'Nộp CV'}</>}
      </button>
      {!resubmit && (
        <p className="mt-5 flex gap-2 rounded-xl bg-amber/10 p-3 text-xs text-ink/70">
          <Lightbulb className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
          Ghi kỹ năng trong CV đúng tên như trong tin (vd “Spring Boot”) để AI nhận diện chính xác. CV phải là file có chữ, không phải ảnh scan.
        </p>
      )}
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
              <AppliedPanel application={application} job={job.data} requiredSkills={parseSkills(job.data.requiredSkills)} />
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
