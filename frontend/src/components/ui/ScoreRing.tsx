import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { bandLabel, bandTone, formatScore, scoreBand } from '../../lib/score';
import type { CvStatus } from '../../types';

const sizes = {
  sm: { box: 44, stroke: 4, text: 'text-sm' },
  md: { box: 72, stroke: 6, text: 'text-xl' },
  lg: { box: 148, stroke: 10, text: 'text-5xl' },
} as const;

interface Props {
  score: number | null;
  status: CvStatus;
  size?: keyof typeof sizes;
  showLabel?: boolean;
}

/**
 * Vong tron diem AI. Vong "ve" dan tu 0 len diem that khi xuat hien;
 * dang xu ly -> vong net dut xoay; loi -> icon canh bao.
 */
export default function ScoreRing({ score, status, size = 'md', showLabel = false }: Props) {
  const { box, stroke, text } = sizes[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Bat dau tu 0 roi moi dat gia tri that -> CSS transition tao hieu ung ve vong
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(score ?? 0));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  if (status === 'FAILED') {
    return (
      <div
        role="img"
        aria-label="AI không đọc được CV này"
        className="grid shrink-0 place-items-center rounded-full bg-clay/10 text-clay"
        style={{ width: box, height: box }}
      >
        <AlertTriangle className={size === 'lg' ? 'h-10 w-10' : 'h-5 w-5'} />
      </div>
    );
  }

  if (score === null) {
    return (
      <div
        role="img"
        aria-label="AI đang phân tích"
        className="relative shrink-0"
        style={{ width: box, height: box }}
      >
        <svg viewBox={`0 0 ${box} ${box}`} className="h-full w-full animate-[spin_3s_linear_infinite]">
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={`${circumference / 14} ${circumference / 28}`}
            strokeLinecap="round"
            className="stroke-ink/15"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-ink/40">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        </span>
      </div>
    );
  }

  const band = scoreBand(score);
  const tone = bandTone[band];
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div
        role="img"
        aria-label={`Điểm phù hợp ${formatScore(score)} trên 100 — ${bandLabel[band]}`}
        className="relative"
        style={{ width: box, height: box }}
      >
        <svg viewBox={`0 0 ${box} ${box}`} className="h-full w-full -rotate-90">
          <circle cx={box / 2} cy={box / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-ink/[0.08]" />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${tone.stroke} transition-[stroke-dashoffset] duration-1000 ease-out`}
          />
        </svg>
        <span className={`absolute inset-0 grid place-items-center font-display font-semibold ${text} ${tone.text}`}>
          <span className="flex flex-col items-center leading-none">
            {formatScore(score)}
            {size === 'lg' && <span className="mt-1 font-sans text-xs font-medium tracking-wide text-ink/40">/ 100</span>}
          </span>
        </span>
      </div>
      {showLabel && (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.soft} ${tone.text}`}>
          {bandLabel[band]}
        </span>
      )}
    </div>
  );
}
