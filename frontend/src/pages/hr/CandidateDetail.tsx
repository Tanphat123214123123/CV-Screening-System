import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Ban, Briefcase, Download, Eye, EyeOff, Mail, RotateCcw, Sparkles, Star, X } from 'lucide-react';
import ScoreRing from '../../components/ui/ScoreRing';
import SkillChips from '../../components/ui/SkillChips';
import { ReviewPill } from '../../components/ui/StatusPill';
import { Skeleton } from '../../components/ui/States';
import { canShortlist } from '../../lib/candidates';
import { getErrorMessage } from '../../lib/errors';
import { fileExtension } from '../../lib/file';
import { formatDate, initials } from '../../lib/format';
import { MAX_COUNTED_YEARS, POINTS_PER_YEAR, SKILL_WEIGHT, formatScore, scoreBreakdown } from '../../lib/score';
import { isRecognizedSkill, isRuleBasedSummary, parseSkills, restoreCase } from '../../lib/skills';
import { getDownloadUrl } from '../../services/cvService';
import type { CandidateMatch, ReviewStatus } from '../../types';

interface Props {
  candidate: CandidateMatch;
  requiredSkills: string[];
  /** Tu dien ky nang cua AI (rong = chua biet) - de chi ra ky nang "thieu" do AI khong nhan dien duoc. */
  dictionary: string[];
  onReview: (status: ReviewStatus) => void;
  reviewPending: boolean;
  onClose: () => void;
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1 hidden rounded border border-current/30 px-1 font-sans text-[10px] font-semibold opacity-60 lg:inline">
      {children}
    </kbd>
  );
}

function ScoreExplanation({ c }: { c: CandidateMatch }) {
  if (c.score === null) return null;
  const b = scoreBreakdown(
    c.score,
    parseSkills(c.matchedSkills).length,
    parseSkills(c.missingSkills).length,
    c.yearsExperience,
  );
  if (!b) return null;
  const rows = [
    {
      label: 'Kỹ năng',
      points: b.skillPoints,
      max: SKILL_WEIGHT,
      detail: `${b.matchedCount}/${b.requiredCount} yêu cầu × ${SKILL_WEIGHT}`,
    },
    {
      label: 'Kinh nghiệm',
      points: b.experiencePoints,
      max: MAX_COUNTED_YEARS * POINTS_PER_YEAR,
      detail: `${b.countedYears} năm × ${POINTS_PER_YEAR} (tính tối đa ${MAX_COUNTED_YEARS} năm)`,
    },
  ];
  return (
    <section aria-labelledby="score-why" className="rounded-2xl border border-ink/[0.08] p-4">
      <h3 id="score-why" className="text-base font-semibold">Vì sao {formatScore(c.score)} điểm?</h3>
      <dl className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between text-sm">
              <dt className="font-medium">{r.label}</dt>
              <dd>
                <span className="font-display text-base font-semibold">{formatScore(Math.round(r.points * 10) / 10)}</span>
                <span className="text-ink/45"> / {r.max}</span>
              </dd>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
              <div className="h-full rounded-full bg-moss" style={{ width: `${(r.points / r.max) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink/50">{r.detail}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Presigned URL song 15 phut -> cache 10 phut la an toan. */
const URL_STALE_MS = 10 * 60 * 1000;

export default function CandidateDetail({ candidate: c, requiredSkills, dictionary, onReview, reviewPending, onClose }: Props) {
  const [preview, setPreview] = useState(false);
  const isPdf = fileExtension(c.fileName) === 'pdf';
  const matched = restoreCase(parseSkills(c.matchedSkills), requiredSkills);
  const missing = restoreCase(parseSkills(c.missingSkills), requiredSkills);
  // Tong so ky nang luc cham (khop + thieu), khong phai JD hien tai - JD co the vua doi
  const requiredCount = matched.length + missing.length;
  const unrecognized = dictionary.length ? missing.filter((s) => !isRecognizedSkill(s, dictionary)) : [];

  const cvUrl = useQuery({
    queryKey: ['cv-url', c.cvId],
    queryFn: () => getDownloadUrl(c.cvId),
    enabled: preview,
    staleTime: URL_STALE_MS,
  });

  const download = async () => {
    try {
      const url = cvUrl.data ?? (await getDownloadUrl(c.cvId));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không tải được file CV'));
    }
  };

  return (
    <article className="card animate-fade-up overflow-hidden" aria-labelledby="candidate-name">
      {/* ---- Dau trang: danh tinh + diem ---- */}
      <div className="relative bg-gradient-to-br from-mint/70 via-surface to-surface p-6">
        <button onClick={onClose} className="btn-ghost absolute right-3 top-3 h-9 w-9 p-0 lg:hidden" aria-label="Đóng chi tiết">
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-forest font-display text-lg font-semibold text-cream">
                {initials(c.candidateName)}
              </span>
              <div className="min-w-0 text-left">
                <h2 id="candidate-name" className="truncate text-2xl font-semibold">{c.candidateName}</h2>
                <a href={`mailto:${c.candidateEmail}`} className="inline-flex items-center gap-1 text-sm text-ink/55 hover:text-moss">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {c.candidateEmail}
                </a>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <ReviewPill status={c.reviewStatus} />
              <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink/60">
                Nộp {formatDate(c.uploadedAt)}
              </span>
              {c.yearsExperience !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink/60">
                  <Briefcase className="h-3 w-3" aria-hidden="true" /> ~{c.yearsExperience} năm kinh nghiệm
                </span>
              )}
            </div>
          </div>
          <ScoreRing score={c.score} status={c.status} size="lg" showLabel />
        </div>
      </div>

      <div className="space-y-6 p-6">
        {c.status === 'PENDING' && (
          <p className="flex items-center gap-2 rounded-xl bg-amber/10 p-3 text-sm">
            <Sparkles className="h-4 w-4 animate-pulse text-amber" aria-hidden="true" />
            AI đang phân tích CV — kết quả sẽ tự hiện ở đây.
          </p>
        )}
        {c.status === 'FAILED' && (
          <p className="rounded-xl bg-clay/10 p-3 text-sm text-clay">
            AI không đọc được file này (có thể là ảnh scan hoặc file hỏng). Hãy mở CV để xem trực tiếp.
          </p>
        )}

        {c.status === 'PROCESSED' && (
          <>
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-base font-semibold">Kỹ năng khớp</h3>
                <span className="text-xs text-ink/50">{matched.length}/{requiredCount} yêu cầu</span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
                <div
                  className="h-full rounded-full bg-moss transition-[width] duration-700"
                  style={{ width: `${requiredCount ? (matched.length / requiredCount) * 100 : 0}%` }}
                />
              </div>
              {matched.length > 0 ? (
                <SkillChips skills={matched} variant="matched" />
              ) : (
                <p className="text-sm text-ink/50">Không khớp kỹ năng nào.</p>
              )}
            </section>

            {missing.length > 0 && (
              <section>
                <h3 className="mb-2 text-base font-semibold">Còn thiếu</h3>
                <SkillChips
                  skills={missing}
                  variant="missing"
                  flag={(s) => unrecognized.includes(s)}
                  flagTitle="AI không nhận diện được kỹ năng này"
                />
                {unrecognized.length > 0 && (
                  <p className="mt-2 text-xs text-ink/60">
                    AI không nhận diện được {unrecognized.join(', ')} nên luôn tính là thiếu — hãy tự kiểm tra trong CV.
                  </p>
                )}
              </section>
            )}

            <ScoreExplanation c={c} />

            {c.summary && !isRuleBasedSummary(c.summary) && (
              <section className="relative rounded-2xl bg-forest p-5 text-cream">
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Nhận xét của AI
                </p>
                <p className="whitespace-pre-line font-display text-[17px] leading-relaxed text-white/90">{c.summary}</p>
              </section>
            )}
          </>
        )}

        {/* ---- Hanh dong cua HR ---- */}
        <section aria-label="Xử lý hồ sơ" className="flex flex-wrap gap-2 border-t border-ink/[0.07] pt-5">
          <button
            onClick={() => onReview(c.reviewStatus === 'SHORTLISTED' ? 'NEW' : 'SHORTLISTED')}
            aria-pressed={c.reviewStatus === 'SHORTLISTED'}
            aria-keyshortcuts="S"
            disabled={reviewPending || !canShortlist(c)}
            title={!canShortlist(c) ? 'Chỉ shortlist được hồ sơ đã được AI chấm điểm xong' : undefined}
            className={c.reviewStatus === 'SHORTLISTED' ? 'btn-accent' : 'btn-outline'}
          >
            <Star className={`h-4 w-4 ${c.reviewStatus === 'SHORTLISTED' ? 'fill-current' : ''}`} aria-hidden="true" />
            {c.reviewStatus === 'SHORTLISTED' ? 'Đã shortlist' : 'Shortlist'}
            <Kbd>S</Kbd>
          </button>
          <button
            onClick={() => onReview(c.reviewStatus === 'REJECTED' ? 'NEW' : 'REJECTED')}
            aria-pressed={c.reviewStatus === 'REJECTED'}
            aria-keyshortcuts="X"
            disabled={reviewPending}
            className={c.reviewStatus === 'REJECTED' ? 'btn bg-clay text-paper' : 'btn-danger'}
          >
            {c.reviewStatus === 'REJECTED' ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Ban className="h-4 w-4" aria-hidden="true" />}
            {c.reviewStatus === 'REJECTED' ? 'Bỏ loại' : 'Loại'}
            <Kbd>X</Kbd>
          </button>
          <span className="flex-1" />
          {isPdf && (
            <button onClick={() => setPreview((v) => !v)} aria-expanded={preview} className="btn-ghost">
              {preview ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              {preview ? 'Ẩn CV' : 'Xem CV'}
            </button>
          )}
          <button onClick={download} className="btn-ghost">
            <Download className="h-4 w-4" aria-hidden="true" /> Tải về
          </button>
        </section>

        {preview && (
          <section aria-label="Xem trước CV" className="overflow-hidden rounded-2xl border border-ink/10">
            {cvUrl.isPending ? (
              <Skeleton className="h-[70vh] w-full rounded-none" />
            ) : cvUrl.isError ? (
              <p className="p-6 text-center text-sm text-clay">Không tải được bản xem trước.</p>
            ) : (
              <iframe src={cvUrl.data} title={`CV của ${c.candidateName}`} className="h-[70vh] w-full bg-white" />
            )}
          </section>
        )}
        {!isPdf && (
          <p className="text-xs text-ink/45">File DOCX không xem trước được trên trình duyệt — dùng “Tải về”.</p>
        )}
      </div>
    </article>
  );
}
