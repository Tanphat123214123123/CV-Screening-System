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
      <h1 className="mb-6 text-2xl font-extrabold">Đơn ứng tuyển của tôi</h1>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-mint text-left text-moss">
            <tr>
              <th className="px-4 py-3">Vị trí</th>
              <th className="px-4 py-3">File CV</th>
              <th className="px-4 py-3">Ngày nộp</th>
              <th className="px-4 py-3">Kết quả AI</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.cvId} className="border-t border-ink/5">
                <td className="px-4 py-3 font-medium">{app.jobTitle}</td>
                <td className="px-4 py-3 text-ink/60">{app.fileName}</td>
                <td className="px-4 py-3 text-ink/60">
                  {new Date(app.uploadedAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={app.score} status={app.status} />
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/50">
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
