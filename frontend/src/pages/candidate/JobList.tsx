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
      <span className="eyebrow text-moss">Ứng viên</span>
      <h1 className="mt-2 font-display text-display-lg font-semibold">Việc làm đang tuyển</h1>
      <p className="mt-2 max-w-xl text-ink/60">
        Nộp CV (PDF/DOCX) — AI sẽ phân tích và chấm điểm mức độ phù hợp của bạn.
      </p>
      {message && (
        <div className="mt-5 animate-fade-up border-l-4 border-moss bg-mint/60 px-4 py-3 text-sm font-medium text-moss">
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
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="group panel flex flex-col border-t-2 border-t-ink/15 p-5 transition-colors duration-200 hover:border-t-moss"
          >
            <h2 className="font-display text-lg font-semibold">{job.title}</h2>
            {job.location && <p className="eyebrow mt-1 text-ink/40">{job.location}</p>}
            <p className="mt-3 line-clamp-3 flex-1 text-sm text-ink/70">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-sm border border-ink/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-ink/60"
                >
                  {skill}
                </span>
              ))}
            </div>
            <button
              disabled={uploading}
              onClick={() => {
                setSelectedJob(job);
                fileInputRef.current?.click();
              }}
              className="btn-accent mt-5 w-full"
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
