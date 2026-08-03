import { useEffect, useRef, useState } from 'react';
import { uploadCv } from '../../services/cvService';
import { getJobs } from '../../services/jobService';
import type { Job } from '../../types';

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getJobs().then(setJobs).catch(() => setMessage('Không tải được danh sách việc làm'));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedJob) return;
    setUploading(true);
    setMessage('');
    try {
      const res = await uploadCv(selectedJob.id, file);
      setMessage(`✓ ${res.message}`);
      setSelectedJob(null);
    } catch (err: any) {
      setMessage(err.response?.data?.message ?? 'Nộp CV thất bại');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Việc làm đang tuyển</h1>
      <p className="mb-6 text-sm text-ink/60">
        Nộp CV (PDF/DOCX) — AI sẽ phân tích và chấm điểm mức độ phù hợp của bạn.
      </p>
      {message && (
        <div className="mb-4 rounded-lg bg-mint px-4 py-3 text-sm font-medium text-moss">
          {message}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {jobs.map((job) => (
          <article key={job.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">{job.title}</h2>
            {job.location && <p className="text-sm text-ink/50">{job.location}</p>}
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink/70">{job.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {job.requiredSkills.split(',').slice(0, 5).map((skill) => (
                <span key={skill} className="rounded bg-mint px-2 py-0.5 text-xs text-moss">
                  {skill.trim()}
                </span>
              ))}
            </div>
            <button
              disabled={uploading}
              onClick={() => {
                setSelectedJob(job);
                fileInputRef.current?.click();
              }}
              className="mt-4 rounded-lg bg-moss py-2 text-sm font-semibold text-white hover:bg-ink disabled:opacity-50"
            >
              {uploading && selectedJob?.id === job.id ? 'Đang nộp…' : 'Nộp CV'}
            </button>
          </article>
        ))}
        {jobs.length === 0 && (
          <p className="text-ink/50">Hiện chưa có tin tuyển dụng nào.</p>
        )}
      </div>
    </div>
  );
}
