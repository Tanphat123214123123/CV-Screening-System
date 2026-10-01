/**
 * Contract test voi AI worker: CUNG bo du lieu contracts/ai-rules.json voi ai-worker/tests/test_contracts.py.
 * Do o day nghia la frontend dang canh bao / giai thich diem KHAC voi cach worker that su cham.
 */
import { describe, expect, it } from 'vitest';
import rules from '../../../contracts/ai-rules.json';
import { scoreBreakdown } from './score';
import { isRecognizedSkill } from './skills';

describe('hop dong nhan dien ky nang (matcher.py)', () => {
  const { dictionary, cases } = rules.skillRecognition;
  it.each(cases)('"$skill" -> recognized = $recognized', ({ skill, recognized }) => {
    expect(isRecognizedSkill(skill, dictionary)).toBe(recognized);
  });
});

describe('hop dong cong thuc diem (scorer.py)', () => {
  it.each(rules.scoring.cases)('$matched khop, $missing thieu, $years nam -> $score', ({ matched, missing, years, score }) => {
    const breakdown = scoreBreakdown(score, matched, missing, years);
    expect(breakdown).not.toBeNull();
    expect(breakdown!.skillPoints + breakdown!.experiencePoints).toBeCloseTo(score, 1);
  });

  it('tu choi giai thich khi so lieu khong ra dung diem worker da cham', () => {
    expect(scoreBreakdown(90, 3, 1, 4)).toBeNull();
    expect(scoreBreakdown(50, 0, 0, 3)).toBeNull();
  });
});
