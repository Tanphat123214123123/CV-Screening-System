import { useEffect, useState } from 'react';
import ScoreBadge from '../../components/common/ScoreBadge';
import { getMyApplications } from '../../services/cvService';
import type { MyApplication } from '../../types';

export default function MyApplications() {
  const [applications, setApplications] = useState<MyApplication[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = () =>
      getMyApplications()
        .then((data) => {
          setApplications(data);
          // Dung polling khi khong con don nao dang cho worker xu ly (PENDING)
          if (timer && data.length > 0 && data.every((app) => app.status !== 'PENDING')) {
            clearInterval(timer);
          }
        })
        .catch(() => {});
    load();
    // Tu dong lam moi de thay trang thai chuyen PENDING -> PROCESSED
    timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <span className="eyebrow text-moss">Ứng viên</span>
      <h1 className="mt-2 font-display text-display-lg font-semibold">Đơn ứng tuyển của tôi</h1>

      <div className="mt-8 panel overflow-hidden border-t-2 border-t-ink">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink/10">
              <th className="eyebrow px-4 py-3 text-left">Vị trí</th>
              <th className="eyebrow px-4 py-3 text-left">File CV</th>
              <th className="eyebrow px-4 py-3 text-left">Ngày nộp</th>
              <th className="eyebrow px-4 py-3 text-left">Kết quả AI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {applications.map((app) => (
              <tr key={app.cvId} className="transition-colors duration-200 hover:bg-mint/40">
                <td className="px-4 py-3.5 font-medium">{app.jobTitle}</td>
                <td className="px-4 py-3.5 text-ink/60">{app.fileName}</td>
                <td className="px-4 py-3.5 font-mono text-xs text-ink/60">
                  {new Date(app.uploadedAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3.5">
                  <ScoreBadge score={app.score} status={app.status} />
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink/50">
                  Bạn chưa nộp CV nào. Vào mục Việc làm để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
