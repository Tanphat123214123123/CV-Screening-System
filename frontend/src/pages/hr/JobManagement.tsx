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

  const inputClass =
    'w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-moss focus:outline-none';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Tin tuyển dụng</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-ink"
        >
          {showForm ? 'Đóng' : '+ Đăng tin mới'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <div className="mb-6 space-y-3 rounded-xl bg-white p-5 shadow-sm">
          <input
            placeholder="Tiêu đề, vd: Backend Developer (Java)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
          <textarea
            placeholder="Mô tả công việc"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Kỹ năng yêu cầu, phân cách bằng dấu phẩy — AI dùng danh sách này để chấm điểm CV"
            value={form.requiredSkills}
            onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Địa điểm"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className={inputClass}
          />
          <button
            onClick={handleCreate}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-bold text-ink hover:opacity-90"
          >
            Đăng tin
          </button>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-bold">{job.title}</h2>
              <p className="mt-1 text-sm text-ink/60">{job.requiredSkills}</p>
            </div>
            <button
              onClick={() => handleDelete(job.id)}
              className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Đóng tin
            </button>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-ink/50">Chưa có tin tuyển dụng nào.</p>}
      </div>
    </div>
  );
}
