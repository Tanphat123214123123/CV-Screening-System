import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Briefcase, Hourglass, MapPin, Pencil, Plus, Power, RotateCcw, Star, Users } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/Dialog';
import PageHeader from '../../components/ui/PageHeader';
import SkillChips from '../../components/ui/SkillChips';
import { JobStatePill } from '../../components/ui/StatusPill';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/ui/States';
import { useAuth } from '../../context/AuthContext';
import { useMyJobs, useToggleJob } from '../../hooks/queries';
import { getErrorMessage } from '../../lib/errors';
import { formatDate, formatRelative, greeting } from '../../lib/format';
import { bandTone, formatScore, scoreBand } from '../../lib/score';
import { parseSkills } from '../../lib/skills';
import type { MyJob } from '../../types';
import JobFormDialog from './JobFormDialog';

type Tab = 'active' | 'closed' | 'all';

function StatTile({ label, value, hint, Icon, tone = 'text-ink', pulse = false }: {
  label: string; value: number | string; hint?: string; Icon: typeof Users; tone?: string; pulse?: boolean;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <Icon className={`absolute -right-3 -top-3 h-20 w-20 opacity-[0.06] ${tone}`} aria-hidden="true" />
      <p className="flex items-center gap-2 text-sm font-medium text-ink/55">
        {pulse && <span className="h-2 w-2 animate-pulse rounded-full bg-amber" aria-hidden="true" />}
        {label}
      </p>
      <p className={`mt-2 font-display text-4xl font-semibold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

function AverageBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-sm text-ink/40">—</span>;
  const tone = bandTone[scoreBand(score)];
  return (
    <div className="w-full">
      <span className={`font-display text-lg font-semibold ${tone.text}`}>{formatScore(score)}</span>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function JobRow({ job, onEdit, onClose, onReopen, index }: {
  job: MyJob; onEdit: () => void; onClose: () => void; onReopen: () => void; index: number;
}) {
  const metrics = [
    { label: 'Hồ sơ', value: job.applicantCount },
    { label: '≥ 70 điểm', value: job.strongCount },
    { label: 'Shortlist', value: job.shortlistedCount },
  ];

  return (
    <li
      className={`card animate-fade-up p-5 transition hover:shadow-lift sm:p-6 ${job.active ? '' : 'opacity-75'}`}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <JobStatePill active={job.active} />
            {job.pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-semibold text-amber">
                <Hourglass className="h-3 w-3 animate-pulse" aria-hidden="true" /> {job.pendingCount} đang chấm
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold">
            <Link to={`/hr/jobs/${job.id}`} className="hover:text-moss">{job.title}</Link>
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink/50">
            {job.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" /> {job.location}</span>
            )}
            <span title={formatDate(job.createdAt)}>Đăng {formatRelative(job.createdAt)}</span>
          </p>
          <div className="mt-3">
            <SkillChips skills={parseSkills(job.requiredSkills)} max={5} size="sm" />
          </div>
        </div>

        <dl className="grid grid-cols-4 gap-4 border-t border-ink/[0.07] pt-4 lg:w-[360px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt className="text-[11px] text-ink/50">{m.label}</dt>
              <dd className="font-display text-lg font-semibold">{m.value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-[11px] text-ink/50">Điểm TB</dt>
            <dd><AverageBar score={job.averageScore} /></dd>
          </div>
        </dl>

        <div className="flex items-center gap-1 lg:flex-col lg:items-stretch">
          <Link to={`/hr/jobs/${job.id}`} className="btn-primary flex-1 lg:flex-none">
            Ứng viên <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="flex gap-1 lg:justify-center">
            <button onClick={onEdit} className="btn-ghost h-9 w-9 p-0" aria-label={`Sửa tin ${job.title}`} title="Sửa tin">
              <Pencil className="h-4 w-4" />
            </button>
            {job.active ? (
              <button onClick={onClose} className="btn-ghost h-9 w-9 p-0 hover:text-clay" aria-label={`Đóng tin ${job.title}`} title="Đóng tin">
                <Power className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={onReopen} className="btn-ghost h-9 w-9 p-0 hover:text-moss" aria-label={`Mở lại tin ${job.title}`} title="Mở lại tin">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: jobs, isPending, isError, refetch } = useMyJobs();
  const toggle = useToggleJob();
  const [tab, setTab] = useState<Tab>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MyJob | null>(null);
  const [closing, setClosing] = useState<MyJob | null>(null);

  const firstName = user?.fullName.trim().split(/\s+/).pop() ?? '';
  const list = jobs ?? [];
  const counts = { active: list.filter((j) => j.active).length, closed: list.filter((j) => !j.active).length, all: list.length };
  const visible = list.filter((j) => (tab === 'all' ? true : tab === 'active' ? j.active : !j.active));
  const total = (key: 'applicantCount' | 'pendingCount' | 'strongCount' | 'shortlistedCount') =>
    list.reduce((sum, j) => sum + j[key], 0);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const setActive = (job: MyJob, active: boolean) =>
    toggle.mutate(
      { id: job.id, active },
      {
        onSuccess: () => {
          toast.success(active ? `Đã mở lại “${job.title}”` : `Đã đóng “${job.title}”`);
          setClosing(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
      },
    );

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        title={<>{greeting()}, <span className="accent-italic">{firstName}</span></>}
        description="Toàn cảnh các vị trí bạn đang tuyển và hồ sơ AI đã chấm."
        actions={
          <button onClick={openCreate} className="btn-accent px-5 py-2.5">
            <Plus className="h-4 w-4" aria-hidden="true" /> Đăng tin mới
          </button>
        }
      />

      <section aria-label="Số liệu tổng quan" className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isPending ? (
          <CardSkeletons count={4} className="h-32" />
        ) : (
          <>
            <StatTile label="Tin đang tuyển" value={counts.active} hint={`${counts.closed} tin đã đóng`} Icon={Briefcase} />
            <StatTile label="Tổng hồ sơ" value={total('applicantCount')} Icon={Users} />
            <StatTile label="Đang chờ AI" value={total('pendingCount')} Icon={Hourglass} tone="text-amber" pulse={total('pendingCount') > 0} />
            <StatTile label="Phù hợp cao (≥ 70)" value={total('strongCount')} hint={`${total('shortlistedCount')} đã vào shortlist`} Icon={Star} tone="text-moss" />
          </>
        )}
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Tin tuyển dụng</h2>
        <div role="group" aria-label="Lọc theo trạng thái tin" className="inline-flex rounded-full border border-ink/10 bg-surface p-1">
          {([['active', 'Đang tuyển'], ['closed', 'Đã đóng'], ['all', 'Tất cả']] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === value ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {label} <span className="ml-0.5 opacity-60">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState message="Không tải được tin tuyển dụng" onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="grid gap-4"><CardSkeletons count={3} className="h-40" /></div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={list.length === 0 ? 'Bạn chưa đăng tin nào' : tab === 'closed' ? 'Chưa có tin nào đóng' : 'Không có tin đang tuyển'}
          description={list.length === 0 ? 'Đăng tin đầu tiên và để AI sàng lọc CV giúp bạn.' : undefined}
          action={tab !== 'closed' ? <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Đăng tin mới</button> : undefined}
        />
      ) : (
        <ul className="grid gap-4">
          {visible.map((job, i) => (
            <JobRow
              key={job.id}
              job={job}
              index={i}
              onEdit={() => {
                setEditing(job);
                setFormOpen(true);
              }}
              onClose={() => setClosing(job)}
              onReopen={() => setActive(job, true)}
            />
          ))}
        </ul>
      )}

      <JobFormDialog open={formOpen} job={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={closing !== null}
        title="Đóng tin tuyển dụng?"
        description={`“${closing?.title ?? ''}” sẽ ngừng nhận CV mới. Bạn vẫn xem được ứng viên cũ và có thể mở lại bất cứ lúc nào.`}
        confirmLabel="Đóng tin"
        tone="danger"
        pending={toggle.isPending}
        onConfirm={() => closing && setActive(closing, false)}
        onClose={() => setClosing(null)}
      />
    </>
  );
}
