import { useEffect, useState } from 'react';
import { createJob, deleteJob, getJobs, type JobInput } from '../../services/jobService';
import type { Job } from '../../types';

const emptyForm: JobInput = { title: '', description: '', requiredSkills: '', location: '' };

export default function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () => getJobs().then(setJobs).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setError('');
    try {
      await createJob(form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Tạo tin thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Đóng tin tuyển dụng này?')) return;
    setError('');
    try {
      await deleteJob(id);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đóng tin thất bại');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-amber-dark">Nhà tuyển dụng</span>
          <h1 className="mt-2 font-display text-display-lg font-semibold">Tin tuyển dụng</h1>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Đóng' : '+ Đăng tin mới'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rust">{error}</p>}

      {showForm && (
        <div className="panel mt-6 animate-fade-up space-y-3 border-t-2 border-t-amber p-6">
          <span className="eyebrow text-ink/40">Biểu mẫu · Tin mới</span>
          <input
            placeholder="Tiêu đề, vd: Backend Developer (Java)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="field mt-2"
          />
          <textarea
            placeholder="Mô tả công việc"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="field"
          />
          <input
            placeholder="Kỹ năng yêu cầu, phân cách bằng dấu phẩy — AI dùng danh sách này để chấm điểm CV"
            value={form.requiredSkills}
            onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
            className="field"
          />
          <input
            placeholder="Địa điểm"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="field"
          />
          <button onClick={handleCreate} className="btn-accent">
            Đăng tin
          </button>
        </div>
      )}

      <div className="panel mt-6 divide-y divide-ink/10 border-t-2 border-t-ink">
        {jobs.map((job) => (
          <div key={job.id} className="flex items-start justify-between gap-4 p-5">
            <div>
              <h2 className="font-display text-base font-semibold">{job.title}</h2>
              <p className="mt-1 font-mono text-xs text-ink/50">{job.requiredSkills}</p>
            </div>
            <button onClick={() => handleDelete(job.id)} className="btn-danger px-3 py-1.5 text-xs">
              Đóng tin
            </button>
          </div>
        ))}
        {jobs.length === 0 && <p className="p-5 text-ink/50">Chưa có tin tuyển dụng nào.</p>}
      </div>
    </div>
  );
}
