export type ScoreBand = 'high' | 'mid' | 'low';

/** Nguong phan loai diem - khop voi STRONG_SCORE (70) o backend. */
export const HIGH_SCORE = 70;
export const MID_SCORE = 40;

export function scoreBand(score: number): ScoreBand {
  if (score >= HIGH_SCORE) return 'high';
  if (score >= MID_SCORE) return 'mid';
  return 'low';
}

export const bandLabel: Record<ScoreBand, string> = {
  high: 'Rất phù hợp',
  mid: 'Tương đối',
  low: 'Chưa phù hợp',
};

/** Class mau cho tung muc diem - viet day du de Tailwind quet duoc (khong ghep chuoi dong). */
export const bandTone: Record<ScoreBand, { text: string; soft: string; stroke: string; bar: string }> = {
  high: { text: 'text-moss', soft: 'bg-moss/10', stroke: 'stroke-moss', bar: 'bg-moss' },
  mid: { text: 'text-amber', soft: 'bg-amber/15', stroke: 'stroke-amber', bar: 'bg-amber' },
  low: { text: 'text-clay', soft: 'bg-clay/10', stroke: 'stroke-clay', bar: 'bg-clay' },
};

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}
