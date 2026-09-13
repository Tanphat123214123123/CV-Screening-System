interface Props {
  score: number | null;
  status: string;
}

/** Hien thi diem AI: mau sac theo muc do phu hop. */
export default function ScoreBadge({ score, status }: Props) {
  if (status === 'FAILED') {
    return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Lỗi xử lý</span>;
  }
  if (score === null) {
    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
        Đang phân tích…
      </span>
    );
  }
  const color =
    score >= 70 ? 'bg-moss text-white' : score >= 40 ? 'bg-amber text-ink' : 'bg-gray-200 text-ink';
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${color}`}>{score}/100</span>
  );
}
