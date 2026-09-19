import { useEffect, useState } from 'react';
import ScoreBadge from '../../components/common/ScoreBadge';
import { getCandidatesForJob, getDownloadUrl } from '../../services/cvService';
import { getJobs } from '../../services/jobService';
import type { CandidateMatch, Job } from '../../types';

export default function CandidateReview() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getJobs()
      .then((data) => {
        setJobs(data);
        if (data.length > 0) setSelectedJobId(data[0].id);
      })
      .catch((err) => setError(err.response?.data?.message ?? 'Không tải được danh sách tin tuyển dụng'));
  }, []);

  useEffect(() => {
    if (selectedJobId === null) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = () =>
      getCandidatesForJob(selectedJobId)
        .then((data) => {
          setCandidates(data);
          setError('');
          // Dung polling khi khong con ho so nao dang cho worker xu ly (PENDING)
          if (timer && data.length > 0 && data.every((c) => c.status !== 'PENDING')) {
            clearInterval(timer);
          }
        })
        .catch((err) => setError(err.response?.data?.message ?? 'Không tải được danh sách'));
    load();
    timer = setInterval(load, 5000); // tu dong cap nhat khi worker xu ly xong
    return () => clearInterval(timer);
  }, [selectedJobId]);

  const handleDownload = async (cvId: number) => {
    try {
      const url = await getDownloadUrl(cvId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Không tải được file CV');
    }
  };

  return (
    <div>
      <span className="eyebrow text-amber-dark">Nhà tuyển dụng</span>
      <h1 className="mt-2 font-display text-display-lg font-semibold">Xét duyệt ứng viên</h1>
      <p className="mt-2 max-w-xl text-ink/60">
        Ứng viên được xếp hạng theo điểm phù hợp do AI chấm, cao nhất đứng đầu.
      </p>

      <select
        value={selectedJobId ?? ''}
        onChange={(e) => setSelectedJobId(Number(e.target.value))}
        className="field mt-6 max-w-md"
      >
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>{job.title}</option>
        ))}
      </select>

      {error && <p className="mt-4 text-sm font-medium text-rust">{error}</p>}

      <div className="panel mt-6 divide-y divide-ink/10 border-t-2 border-t-ink">
        {candidates.map((c) => (
          <article key={c.cvId} className="p-5 transition-colors duration-200 hover:bg-mint/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">{c.candidateName}</h2>
                <p className="font-mono text-xs text-ink/50">{c.candidateEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreBadge score={c.score} status={c.status} />
                <button onClick={() => handleDownload(c.cvId)} className="btn-secondary px-3 py-1.5 text-xs">
                  Tải CV
                </button>
              </div>
            </div>

            {c.status === 'PROCESSED' && (
              <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
                {c.matchedSkills && (
                  <p>
                    <span className="eyebrow text-moss">Kỹ năng trùng khớp </span>{' '}
                    <span className="text-ink/80">{c.matchedSkills}</span>
                  </p>
                )}
                {c.missingSkills && (
                  <p>
                    <span className="eyebrow text-amber-dark">Còn thiếu </span>{' '}
                    <span className="text-ink/80">{c.missingSkills}</span>
                  </p>
                )}
                {c.yearsExperience !== null && (
                  <p>
                    <span className="eyebrow text-ink/50">Kinh nghiệm </span>{' '}
                    <span className="text-ink/80">~{c.yearsExperience} năm</span>
                  </p>
                )}
                {c.summary && <p className="text-ink/70">{c.summary}</p>}
              </div>
            )}
          </article>
        ))}
        {candidates.length === 0 && !error && (
          <p className="p-5 text-ink/50">Chưa có ứng viên nào nộp CV cho vị trí này.</p>
        )}
      </div>
    </div>
  );
}
