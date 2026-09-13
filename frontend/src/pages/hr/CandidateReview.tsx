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
      <h1 className="mb-1 text-2xl font-extrabold">Xét duyệt ứng viên</h1>
      <p className="mb-6 text-sm text-ink/60">
        Ứng viên được xếp hạng theo điểm phù hợp do AI chấm, cao nhất đứng đầu.
      </p>

      <select
        value={selectedJobId ?? ''}
        onChange={(e) => setSelectedJobId(Number(e.target.value))}
        className="mb-6 w-full max-w-md rounded-lg border border-ink/20 bg-white px-3 py-2 focus:border-moss focus:outline-none"
      >
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>{job.title}</option>
        ))}
      </select>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {candidates.map((c) => (
          <article key={c.cvId} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold">{c.candidateName}</h2>
                <p className="text-sm text-ink/50">{c.candidateEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreBadge score={c.score} status={c.status} />
                <button
                  onClick={() => handleDownload(c.cvId)}
                  className="rounded border border-moss px-3 py-1 text-xs font-semibold text-moss hover:bg-mint"
                >
                  Tải CV
                </button>
              </div>
            </div>

            {c.status === 'PROCESSED' && (
              <div className="mt-3 space-y-2 border-t border-ink/5 pt-3 text-sm">
                {c.matchedSkills && (
                  <p>
                    <span className="font-semibold text-moss">Kỹ năng trùng khớp:</span>{' '}
                    {c.matchedSkills}
                  </p>
                )}
                {c.missingSkills && (
                  <p>
                    <span className="font-semibold text-amber">Còn thiếu:</span> {c.missingSkills}
                  </p>
                )}
                {c.yearsExperience !== null && (
                  <p>
                    <span className="font-semibold">Kinh nghiệm:</span> ~{c.yearsExperience} năm
                  </p>
                )}
                {c.summary && <p className="text-ink/70">{c.summary}</p>}
              </div>
            )}
          </article>
        ))}
        {candidates.length === 0 && !error && (
          <p className="text-ink/50">Chưa có ứng viên nào nộp CV cho vị trí này.</p>
        )}
      </div>
    </div>
  );
}
