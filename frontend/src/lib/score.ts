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

/** Muc do phu hop backend tra cho UNG VIEN (khong co diem so) - xem FitLevel.java. */
export type FitLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export const fitToBand: Record<FitLevel, ScoreBand> = { HIGH: 'high', MEDIUM: 'mid', LOW: 'low' };

export const fitLabel: Record<FitLevel, string> = {
  HIGH: 'Rất phù hợp',
  MEDIUM: 'Tương đối phù hợp',
  LOW: 'Chưa phù hợp lắm',
};

/**
 * Cong thuc cham diem - PHAI giong ai-worker/app/nlp/scorer.py:
 *   score = coverage * 80 + min(max(years, 0), 5) * 4
 */
export const SKILL_WEIGHT = 80;
export const POINTS_PER_YEAR = 4;
export const MAX_COUNTED_YEARS = 5;

export interface ScoreBreakdown {
  matchedCount: number;
  requiredCount: number;
  skillPoints: number;
  countedYears: number;
  experiencePoints: number;
}

/**
 * Tach diem thanh phan ky nang + kinh nghiem de HR hieu vi sao ra con so do.
 * requiredCount lay tu ket qua cham (khop + thieu) chu khong tu JD hien tai: JD co the da doi.
 * Tra ve null neu tinh lai KHONG ra dung diem worker da cham (cong thuc hai ben lech nhau)
 * - hien sai con hon khong hien.
 */
export function scoreBreakdown(
  score: number,
  matchedCount: number,
  missingCount: number,
  years: number | null,
): ScoreBreakdown | null {
  const requiredCount = matchedCount + missingCount;
  if (requiredCount === 0) return null;
  const skillPoints = (matchedCount / requiredCount) * SKILL_WEIGHT;
  const countedYears = Math.min(Math.max(years ?? 0, 0), MAX_COUNTED_YEARS);
  const experiencePoints = countedYears * POINTS_PER_YEAR;
  const total = Math.round((skillPoints + experiencePoints) * 10) / 10;
  if (Math.abs(total - score) > 0.05) return null;
  return { matchedCount, requiredCount, skillPoints, countedYears, experiencePoints };
}
