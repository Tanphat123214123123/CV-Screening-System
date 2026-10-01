import { AlertTriangle, Clock, FileSearch, Sparkles, Star } from 'lucide-react';
import { candidateStage, type Stage, type StageKey } from '../../lib/candidateStage';
import { fitLabel, fitToBand, type FitLevel } from '../../lib/score';
import type { MyApplication } from '../../types';

const stageIcon: Record<StageKey, typeof Star> = {
  analyzing: Sparkles,
  unreadable: AlertTriangle,
  waiting: Clock,
  shortlisted: Star,
  rejected: FileSearch,
};

// Viet day du ten class de Tailwind quet duoc
const toneClass: Record<Stage['tone'], { icon: string; text: string }> = {
  amber: { icon: 'bg-amber/15 text-amber', text: 'text-amber' },
  clay: { icon: 'bg-clay/10 text-clay', text: 'text-clay' },
  ink: { icon: 'bg-ink/[0.06] text-ink/60', text: 'text-ink' },
  moss: { icon: 'bg-moss text-paper', text: 'text-moss' },
};

/** Ket qua ho so theo goc nhin ung vien: AI da doc chua, nha tuyen dung da quyet dinh gi. */
export function StageCard({ app, compact = false }: {
  app: Pick<MyApplication, 'status' | 'reviewStatus'>;
  compact?: boolean;
}) {
  const stage = candidateStage(app);
  const Icon = stageIcon[stage.key];
  const tone = toneClass[stage.tone];
  return (
    <div className={`flex items-start gap-3 ${compact ? '' : 'text-left'}`} role="status">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone.icon}`}>
        <Icon
          className={`h-5 w-5 ${stage.key === 'analyzing' ? 'animate-pulse' : ''} ${stage.key === 'shortlisted' ? 'fill-current' : ''}`}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0">
        <p className={`font-semibold ${tone.text}`}>{stage.label}</p>
        {!compact && <p className="mt-0.5 text-sm text-ink/60">{stage.description}</p>}
      </div>
    </div>
  );
}

const segmentColor = { high: 'bg-moss', mid: 'bg-amber', low: 'bg-clay' } as const;
const levelIndex: Record<FitLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

/**
 * Muc do phu hop dang thang 3 nac - co y KHONG hien diem so cho ung vien:
 * con so thap de gay nan va khuyen khich nhoi tu khoa, trong khi thu co ich la biet can bo sung gi.
 */
export function FitMeter({ level }: { level: FitLevel | null }) {
  if (!level) return null;
  const filled = levelIndex[level];
  const color = segmentColor[fitToBand[level]];
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-1" role="img" aria-label={`Mức độ phù hợp theo AI: ${fitLabel[level]}`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2 w-7 rounded-full ${i <= filled ? color : 'bg-ink/10'}`} />
        ))}
      </div>
      <span className="text-xs font-semibold text-ink/65">AI đánh giá: {fitLabel[level]}</span>
    </div>
  );
}
