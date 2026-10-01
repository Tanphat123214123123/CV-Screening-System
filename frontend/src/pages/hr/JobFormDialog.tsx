import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, History } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import SkillChips from '../../components/ui/SkillChips';
import { useSaveJob, useSkillDictionary } from '../../hooks/queries';
import { getErrorMessage, getFieldErrors } from '../../lib/errors';
import { isRecognizedSkill, parseSkills, suggestSkills } from '../../lib/skills';
import type { JobInput } from '../../services/jobService';
import type { Job } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Co job -> che do sua; khong co -> dang tin moi. */
  job?: Job | null;
}

const empty: JobInput = { title: '', description: '', requiredSkills: '', location: '' };

/** Ban nhap tin moi luu trong sessionStorage: het phien / lo tay dong hop thoai khong mat noi dung. */
const DRAFT_KEY = 'job-draft';

function loadDraft(): JobInput | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const draft = raw ? (JSON.parse(raw) as JobInput) : null;
    return draft && Object.values(draft).some((v) => typeof v === 'string' && v.trim()) ? draft : null;
  } catch {
    return null;
  }
}

function saveDraft(form: JobInput | null) {
  try {
    if (form) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Trinh duyet chan storage -> chi mat tinh nang nhap nhap, form van dung duoc
  }
}

function JobForm({ job, onClose }: { job?: Job | null; onClose: () => void }) {
  const [draft] = useState(() => (job ? null : loadDraft()));
  const [form, setForm] = useState<JobInput>(
    job
      ? { title: job.title, description: job.description, requiredSkills: job.requiredSkills, location: job.location ?? '' }
      : (draft ?? empty),
  );
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const save = useSaveJob();
  const dictionary = useSkillDictionary();
  const skills = parseSkills(form.requiredSkills);

  useEffect(() => {
    if (!job) saveDraft(form);
  }, [form, job]);

  // Tu dien rong = AI worker chua dong bo lan nao -> khong du thong tin, khong canh bao bua
  const dict = dictionary.data ?? [];
  const unrecognized = dict.length ? skills.filter((s) => !isRecognizedSkill(s, dict)) : [];

  const errors = {
    title: !form.title.trim() ? 'Nhập tiêu đề vị trí' : '',
    description: !form.description.trim() ? 'Nhập mô tả công việc' : '',
    requiredSkills: skills.length === 0 ? 'Cần ít nhất một kỹ năng để AI chấm điểm' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const set = (key: keyof JobInput) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setServerErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key]; // sua o nao thi an loi server cua o do
      return next;
    });
  };

  const replaceSkill = (from: string, to: string) =>
    setForm((f) => ({
      ...f,
      requiredSkills: parseSkills(f.requiredSkills).map((s) => (s === from ? to : s)).join(', '),
    }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors || save.isPending) return;
    const input: JobInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      requiredSkills: skills.join(', '),
      location: form.location.trim(),
    };
    save.mutate(
      { id: job?.id, input },
      {
        onSuccess: () => {
          if (!job) saveDraft(null);
          toast.success(job ? 'Đã cập nhật tin' : 'Đã đăng tin mới', {
            description: job ? undefined : 'Ứng viên có thể nộp CV ngay bây giờ.',
          });
          onClose();
        },
        onError: (err) => {
          const fieldErrors = getFieldErrors(err);
          setServerErrors(fieldErrors);
          if (Object.keys(fieldErrors).length === 0) toast.error(getErrorMessage(err, 'Lưu tin thất bại'));
        },
      },
    );
  };

  // Loi phia client (sau lan bam dau) uu tien, roi toi loi server tra ve cho dung o do
  const fieldError = (key: keyof JobInput) =>
    (touched && (errors as Record<string, string>)[key]) || serverErrors[key] || '';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {draft && (
        <p className="flex items-center gap-2 rounded-xl bg-moss/10 px-3 py-2 text-xs text-moss">
          <History className="h-4 w-4" aria-hidden="true" /> Đã khôi phục bản nháp chưa đăng.
          <button
            type="button"
            className="ml-auto font-semibold underline-offset-2 hover:underline"
            onClick={() => setForm(empty)}
          >
            Bắt đầu lại
          </button>
        </p>
      )}

      <div>
        <label htmlFor="job-title" className="field-label">Vị trí</label>
        <input
          id="job-title"
          value={form.title}
          onChange={set('title')}
          placeholder="Backend Developer (Java)"
          aria-invalid={!!fieldError('title')}
          aria-describedby="job-title-error"
          className="input"
          autoFocus
        />
        {fieldError('title') && <p id="job-title-error" className="mt-1.5 text-xs font-medium text-clay">{fieldError('title')}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <div>
          <label htmlFor="job-skills" className="field-label">Kỹ năng yêu cầu</label>
          <input
            id="job-skills"
            value={form.requiredSkills}
            onChange={set('requiredSkills')}
            placeholder="Java, Spring Boot, PostgreSQL, Docker"
            aria-invalid={!!fieldError('requiredSkills')}
            aria-describedby="job-skills-hint"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="job-location" className="field-label">Địa điểm</label>
          <input
            id="job-location"
            value={form.location}
            onChange={set('location')}
            placeholder="TP. HCM"
            aria-invalid={!!fieldError('location')}
            className="input"
          />
          {fieldError('location') && <p className="mt-1.5 text-xs font-medium text-clay">{fieldError('location')}</p>}
        </div>
      </div>
      <div id="job-skills-hint" className="-mt-2 space-y-2">
        {fieldError('requiredSkills') ? (
          <p className="text-xs font-medium text-clay">{fieldError('requiredSkills')}</p>
        ) : (
          <p className="text-xs text-ink/50">Phân cách bằng dấu phẩy. AI chấm CV theo đúng danh sách này.</p>
        )}
        <SkillChips
          skills={skills}
          variant="matched"
          size="sm"
          flag={(s) => unrecognized.includes(s)}
          flagTitle="AI chưa nhận diện được kỹ năng này"
        />

        {unrecognized.length > 0 && (
          <div role="status" className="rounded-xl border border-amber/40 bg-amber/10 p-3 text-xs text-ink/80">
            <p className="flex gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
              AI chưa nhận diện được: {unrecognized.join(', ')}
            </p>
            <p className="mt-1 pl-6 text-ink/65">
              Mọi CV sẽ bị tính là <strong>thiếu</strong> các kỹ năng này dù có ghi trong CV, nên điểm bị kéo thấp.
              Hãy đổi sang tên AI nhận ra, hoặc bỏ đi và đánh giá thủ công.
            </p>
            {unrecognized.map((skill) => {
              const suggestions = suggestSkills(skill, dict);
              return suggestions.length > 0 ? (
                <p key={skill} className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
                  <span className="text-ink/60">“{skill}” →</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => replaceSkill(skill, sug)}
                      className="rounded-full border border-moss/40 bg-surface px-2 py-0.5 font-semibold text-moss hover:bg-moss/10"
                    >
                      {sug}
                    </button>
                  ))}
                </p>
              ) : null;
            })}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="job-desc" className="field-label">Mô tả công việc</label>
        <textarea
          id="job-desc"
          rows={6}
          value={form.description}
          onChange={set('description')}
          placeholder={'Trách nhiệm chính…\nYêu cầu…\nQuyền lợi…'}
          aria-invalid={!!fieldError('description')}
          className="input resize-y"
        />
        {fieldError('description') && <p className="mt-1.5 text-xs font-medium text-clay">{fieldError('description')}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-ink/[0.07] pt-5">
        <button type="button" onClick={onClose} className="btn-ghost">Huỷ</button>
        <button type="submit" disabled={save.isPending} className="btn-primary px-6">
          {save.isPending ? 'Đang lưu…' : job ? 'Lưu thay đổi' : 'Đăng tin'}
        </button>
      </div>
    </form>
  );
}

export default function JobFormDialog({ open, onClose, job }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      wide
      title={job ? 'Sửa tin tuyển dụng' : 'Đăng tin mới'}
      description={
        job
          ? 'Đổi kỹ năng yêu cầu sẽ khiến AI chấm lại toàn bộ CV đã nộp cho tin này.'
          : 'Ứng viên sẽ thấy tin ngay sau khi đăng. Bản nháp được tự lưu.'
      }
    >
      {/* key: moi lan mo form cho tin khac thi khoi tao lai state */}
      {open && <JobForm key={job?.id ?? 'new'} job={job} onClose={onClose} />}
    </Dialog>
  );
}
