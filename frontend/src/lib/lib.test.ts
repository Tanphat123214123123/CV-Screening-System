import { describe, expect, it } from 'vitest';
import { candidateStage } from './candidateStage';
import { canShortlist, countByReview, defaultFilters, filterCandidates, nextAfter } from './candidates';
import { getFieldErrors } from './errors';
import { MAX_CV_BYTES, validateCvFile } from './file';
import { formatScore, scoreBand } from './score';
import { postLoginPath } from './navigation';
import { isRuleBasedSummary, parseSkills, restoreCase, suggestSkills } from './skills';
import type { CandidateMatch } from '../types';

describe('scoreBand', () => {
  it('chia nguong 70 / 40 dung bien', () => {
    expect(scoreBand(100)).toBe('high');
    expect(scoreBand(70)).toBe('high');
    expect(scoreBand(69.9)).toBe('mid');
    expect(scoreBand(40)).toBe('mid');
    expect(scoreBand(39.9)).toBe('low');
    expect(scoreBand(0)).toBe('low');
  });

  it('formatScore bo .0 voi so nguyen', () => {
    expect(formatScore(92)).toBe('92');
    expect(formatScore(62.5)).toBe('62.5');
  });
});

describe('parseSkills', () => {
  it('cat khoang trang, bo rong va bo trung khong phan biet hoa thuong', () => {
    expect(parseSkills(' Java, Spring Boot,, java ,  ')).toEqual(['Java', 'Spring Boot']);
  });

  it('null / rong tra ve mang rong', () => {
    expect(parseSkills(null)).toEqual([]);
    expect(parseSkills('')).toEqual([]);
  });
});

describe('restoreCase / isRuleBasedSummary', () => {
  it('dung cach viet cua HR cho ky nang worker tra ve chu thuong', () => {
    expect(restoreCase(['spring boot', 'aws', 'kafka'], ['Spring Boot', 'AWS'])).toEqual(['Spring Boot', 'AWS', 'kafka']);
  });

  it('nhan ra tom tat rule-based cua worker', () => {
    expect(isRuleBasedSummary('Diem phu hop: 96.0/100. Ky nang trung khop: java.')).toBe(true);
    expect(isRuleBasedSummary('Ứng viên có nền tảng Spring Boot vững.')).toBe(false);
  });
});

describe('validateCvFile', () => {
  const file = (name: string, size = 1000) => ({ name, size });

  it('nhan PDF va DOCX (khong phan biet hoa thuong)', () => {
    expect(validateCvFile(file('cv.pdf'))).toBeNull();
    expect(validateCvFile(file('CV.DOCX'))).toBeNull();
  });

  it('tu choi .doc voi huong dan cu the', () => {
    expect(validateCvFile(file('cv.doc'))).toMatch(/\.docx/);
  });

  it('tu choi dinh dang la, file rong, file qua 5MB', () => {
    expect(validateCvFile(file('virus.exe'))).not.toBeNull();
    expect(validateCvFile(file('cv'))).not.toBeNull();
    expect(validateCvFile(file('cv.pdf', 0))).not.toBeNull();
    expect(validateCvFile(file('cv.pdf', MAX_CV_BYTES + 1))).toMatch(/5MB/);
    expect(validateCvFile(file('cv.pdf', MAX_CV_BYTES))).toBeNull();
  });
});

describe('filterCandidates', () => {
  const make = (over: Partial<CandidateMatch>): CandidateMatch => ({
    cvId: 1,
    candidateName: 'A',
    candidateEmail: 'a@x.com',
    fileName: 'cv.pdf',
    status: 'PROCESSED',
    reviewStatus: 'NEW',
    score: 50,
    matchedSkills: null,
    missingSkills: null,
    summary: null,
    yearsExperience: null,
    uploadedAt: '2026-01-01T00:00:00Z',
    reviewedAt: null,
    ...over,
  });

  const list = [
    make({ cvId: 1, candidateName: 'An', score: 55, uploadedAt: '2026-01-03T00:00:00Z' }),
    make({ cvId: 2, candidateName: 'Binh', score: 91, reviewStatus: 'SHORTLISTED', matchedSkills: 'Java, AWS' }),
    make({ cvId: 3, candidateName: 'Chi', score: null, status: 'PENDING', uploadedAt: '2026-01-05T00:00:00Z' }),
    make({ cvId: 4, candidateName: 'Dung', score: 20, reviewStatus: 'REJECTED' }),
  ];
  const ids = (result: CandidateMatch[]) => result.map((c) => c.cvId);

  it('mac dinh: diem cao truoc, CV chua co diem xep cuoi', () => {
    expect(ids(filterCandidates(list, defaultFilters))).toEqual([2, 1, 4, 3]);
  });

  it('sap theo moi nop nhat', () => {
    expect(ids(filterCandidates(list, { ...defaultFilters, sort: 'recent' }))[0]).toBe(3);
  });

  it('nguong diem an CV duoi nguong va CV chua co diem', () => {
    expect(ids(filterCandidates(list, { ...defaultFilters, minScore: 50 }))).toEqual([2, 1]);
  });

  it('loc theo trang thai xu ly va tim theo ten / ky nang', () => {
    expect(ids(filterCandidates(list, { ...defaultFilters, review: 'REJECTED' }))).toEqual([4]);
    expect(ids(filterCandidates(list, { ...defaultFilters, query: 'aws' }))).toEqual([2]);
    expect(ids(filterCandidates(list, { ...defaultFilters, query: '  CHI ' }))).toEqual([3]);
  });

  it('dem so ho so theo trang thai', () => {
    expect(countByReview(list)).toEqual({ ALL: 4, NEW: 2, SHORTLISTED: 1, REJECTED: 1 });
  });
});

describe('goi y ky nang AI nhan ra', () => {
  const dict = ['react', 'react native', 'postgresql', 'node.js', 'kubernetes', 'java'];
  it('goi y ten dung cho cach viet khac', () => {
    expect(suggestSkills('ReactJS', dict)[0]).toBe('react');
    expect(suggestSkills('Postgres', dict)).toContain('postgresql');
    expect(suggestSkills('NodeJS', dict)).toContain('node.js');
    expect(suggestSkills('Kubernete', dict)).toContain('kubernetes');
  });
  it('khong goi y bua cho ky nang khong lien quan', () => {
    expect(suggestSkills('Tiếng Anh', dict)).toEqual([]);
    expect(suggestSkills('x', dict)).toEqual([]);
  });
});

describe('getFieldErrors', () => {
  const axiosError = (data: unknown) =>
    Object.assign(new Error('x'), { isAxiosError: true, response: { status: 400, data } });
  it('lay loi theo tung o tu ApiError', () => {
    expect(getFieldErrors(axiosError({ message: 'm', fieldErrors: { email: 'Email không hợp lệ.' } })))
      .toEqual({ email: 'Email không hợp lệ.' });
  });
  it('khong co fieldErrors / khong phai loi axios -> rong', () => {
    expect(getFieldErrors(axiosError({ message: 'm' }))).toEqual({});
    expect(getFieldErrors(new Error('network'))).toEqual({});
  });
});

describe('candidateStage (goc nhin ung vien)', () => {
  it('uu tien trang thai AI, roi toi quyet dinh cua HR', () => {
    expect(candidateStage({ status: 'PENDING', reviewStatus: 'NEW' }).key).toBe('analyzing');
    expect(candidateStage({ status: 'FAILED', reviewStatus: 'REJECTED' }).key).toBe('unreadable');
    expect(candidateStage({ status: 'PROCESSED', reviewStatus: 'SHORTLISTED' }).key).toBe('shortlisted');
    expect(candidateStage({ status: 'PROCESSED', reviewStatus: 'REJECTED' }).key).toBe('rejected');
    expect(candidateStage({ status: 'PROCESSED', reviewStatus: 'NEW' }).key).toBe('waiting');
  });
});

describe('nextAfter / canShortlist', () => {
  const list = [{ cvId: 1 }, { cvId: 2 }, { cvId: 3 }];
  it('sang ho so ke tiep, het danh sach thi lui ve truoc', () => {
    expect(nextAfter(list, 1)).toBe(2);
    expect(nextAfter(list, 3)).toBe(2);
    expect(nextAfter([{ cvId: 7 }], 7)).toBeNull();
    expect(nextAfter(list, 99)).toBe(1);
  });
  it('chi shortlist ho so AI da cham xong, bo shortlist thi luon duoc', () => {
    expect(canShortlist({ status: 'PROCESSED', reviewStatus: 'NEW' })).toBe(true);
    expect(canShortlist({ status: 'PENDING', reviewStatus: 'NEW' })).toBe(false);
    expect(canShortlist({ status: 'FAILED', reviewStatus: 'SHORTLISTED' })).toBe(true);
  });
});

describe('postLoginPath', () => {
  const at = (state: unknown) => ({ pathname: '/login', search: '', hash: '', key: 'k', state });
  it('quay ve trang dang dung truoc khi het phien', () => {
    expect(postLoginPath(at({ from: { pathname: '/hr/jobs/5', search: '?cv=9' } }) as never, 'HR')).toBe('/hr/jobs/5?cv=9');
  });
  it('khong co trang truoc do -> trang chinh theo vai tro', () => {
    expect(postLoginPath(at(null) as never, 'HR')).toBe('/hr');
    expect(postLoginPath(at({ from: { pathname: '/login', search: '' } }) as never, 'CANDIDATE')).toBe('/jobs');
  });
});
