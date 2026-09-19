interface Props {
  score: number | null;
  status: string;
}

/** Hien thi diem AI: dang "con dau" ho so, mau sac theo muc do phu hop. */
export default function ScoreBadge({ score, status }: Props) {
  if (status === 'FAILED') {
    return (
      <span className="inline-flex -rotate-2 items-center gap-1 rounded-full border-2 border-rust bg-rust/5 px-3 py-1 font-mono text-label uppercase text-rust">
        Lỗi xử lý
      </span>
    );
  }
  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-ink/25 px-3 py-1 font-mono text-label uppercase text-ink/45">
        Đang phân tích…
      </span>
    );
  }
  const tone =
    score >= 70
      ? 'border-moss text-moss bg-moss/5'
      : score >= 40
        ? 'border-amber-dark text-amber-dark bg-amber/10'
        : 'border-ink/30 text-ink/50 bg-transparent';
  return (
    <span
      className={`inline-flex -rotate-2 items-baseline gap-0.5 rounded-full border-2 px-3 py-1 font-mono font-bold ${tone}`}
    >
      <span className="text-sm">{score}</span>
      <span className="text-[10px] opacity-60">/100</span>
    </span>
  );
}
