import type { CandidateMatch, ReviewStatus } from '../types';

export type ReviewFilter = 'ALL' | ReviewStatus;
export type CandidateSort = 'score' | 'recent';

export interface CandidateFilters {
  query: string;
  review: ReviewFilter;
  minScore: number;
  sort: CandidateSort;
}

export const defaultFilters: CandidateFilters = { query: '', review: 'ALL', minScore: 0, sort: 'score' };

/**
 * Loc + sap xep danh sach ung vien phia client.
 * CV chua co diem (dang xu ly / loi) chi bi an khi HR dat nguong diem > 0,
 * va luon xep cuoi khi sap theo diem.
 */
export function filterCandidates(list: CandidateMatch[], filters: CandidateFilters): CandidateMatch[] {
  const query = filters.query.trim().toLowerCase();
  const result = list.filter((c) => {
    if (filters.review !== 'ALL' && c.reviewStatus !== filters.review) return false;
    if (filters.minScore > 0 && (c.score === null || c.score < filters.minScore)) return false;
    if (query) {
      const haystack = `${c.candidateName} ${c.candidateEmail} ${c.matchedSkills ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return [...result].sort((a, b) => {
    if (filters.sort === 'recent') {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
}

export function countByReview(list: CandidateMatch[]): Record<ReviewFilter, number> {
  const counts: Record<ReviewFilter, number> = { ALL: list.length, NEW: 0, SHORTLISTED: 0, REJECTED: 0 };
  for (const c of list) counts[c.reviewStatus] += 1;
  return counts;
}

/** Shortlist chi khi AI da cham xong (khop quy tac backend); bo shortlist thi luon duoc. */
export const canShortlist = (c: Pick<CandidateMatch, 'status' | 'reviewStatus'>) =>
  c.reviewStatus === 'SHORTLISTED' || c.status === 'PROCESSED';

/**
 * Ho so ke tiep sau khi HR quyet dinh xong ho so hien tai (tu dong chuyen, khoi bam lai danh sach).
 * Het danh sach thi lui ve ho so truoc; danh sach chi con chinh no thi null.
 */
export function nextAfter(list: Pick<CandidateMatch, 'cvId'>[], cvId: number): number | null {
  const index = list.findIndex((c) => c.cvId === cvId);
  if (index === -1) return list[0]?.cvId ?? null;
  return list[index + 1]?.cvId ?? list[index - 1]?.cvId ?? null;
}
