import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Dialog } from '../../components/ui/Dialog';
import SkillChips from '../../components/ui/SkillChips';
import { useSaveJob } from '../../hooks/queries';
import { getErrorMessage } from '../../lib/errors';
import { parseSkills } from '../../lib/skills';
import type { JobInput } from '../../services/jobService';
import type { Job } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Co job -> che do sua; khong co -> dang tin moi. */
  job?: Job | null;
}

const empty: JobInput = { title: '', description: '', requiredSkills: '', location: '' };

function JobForm({ job, onClose }: { job?: Job | null; onClose: () => void }) {
  const [form, setForm] = useState<JobInput>(
    job
      ? { title: job.title, description: job.description, requiredSkills: job.requiredSkills, location: job.location ?? '' }
      : empty,
  );
  const [touched, setTouched] = useState(false);
  const save = useSaveJob();
  const skills = parseSkills(form.requiredSkills);

  const errors = {
    title: !form.title.trim() ? 'Nhập tiêu đề vị trí' : '',
    description: !form.description.trim() ? 'Nhập mô tả công việc' : '',
    requiredSkills: skills.length === 0 ? 'Cần ít nhất một kỹ năng để AI chấm điểm' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const set = (key: keyof JobInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
          toast.success(job ? 'Đã cập nhật tin' : 'Đã đăng tin mới', {
            description: job ? undefined : 'Ứng viên có thể nộp CV ngay bây giờ.',
          });
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Lưu tin thất bại')),
      },
    );
  };

  const showError = (key: keyof typeof errors) => touched && errors[key];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="job-title" className="field-label">Vị trí</label>
        <input
          id="job-title"
          value={form.title}
          onChange={set('title')}
          placeholder="Backend Developer (Java)"
          aria-invalid={!!showError('title')}
          aria-describedby="job-title-error"
          className="input"
          autoFocus
        />
        {showError('title') && <p id="job-title-error" className="mt-1.5 text-xs font-medium text-clay">{errors.title}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <div>
          <label htmlFor="job-skills" className="field-label">Kỹ năng yêu cầu</label>
          <input
            id="job-skills"
            value={form.requiredSkills}
            onChange={set('requiredSkills')}
            placeholder="Java, Spring Boot, PostgreSQL, Docker"
            aria-invalid={!!showError('requiredSkills')}
            aria-describedby="job-skills-hint"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="job-location" className="field-label">Địa điểm</label>
          <input id="job-location" value={form.location} onChange={set('location')} placeholder="TP. HCM" className="input" />
        </div>
      </div>
      <div id="job-skills-hint" className="-mt-2 space-y-2">
        {showError('requiredSkills') ? (
          <p className="text-xs font-medium text-clay">{errors.requiredSkills}</p>
        ) : (
          <p className="text-xs text-ink/50">Phân cách bằng dấu phẩy. AI chấm CV theo đúng danh sách này.</p>
        )}
        <SkillChips skills={skills} variant="matched" size="sm" />
      </div>

      <div>
        <label htmlFor="job-desc" className="field-label">Mô tả công việc</label>
        <textarea
          id="job-desc"
          rows={6}
          value={form.description}
          onChange={set('description')}
          placeholder={'Trách nhiệm chính…\nYêu cầu…\nQuyền lợi…'}
          aria-invalid={!!showError('description')}
          className="input resize-y"
        />
        {showError('description') && <p className="mt-1.5 text-xs font-medium text-clay">{errors.description}</p>}
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
      description={job ? 'Thay đổi kỹ năng chỉ áp dụng cho các CV nộp sau.' : 'Ứng viên sẽ thấy tin ngay sau khi đăng.'}
    >
      {/* key: moi lan mo form cho tin khac thi khoi tao lai state */}
      {open && <JobForm key={job?.id ?? 'new'} job={job} onClose={onClose} />}
    </Dialog>
  );
}
