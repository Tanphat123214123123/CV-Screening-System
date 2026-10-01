/**
 * AI worker tra ky nang o dang chu thuong ("spring boot"). Neu ky nang co trong
 * danh sach tham chieu (vd ky nang yeu cau cua tin) thi dung cach viet cua HR ("Spring Boot").
 */
export function restoreCase(skills: string[], reference: string[]): string[] {
  const byLower = new Map(reference.map((r) => [r.toLowerCase(), r]));
  return skills.map((s) => byLower.get(s.toLowerCase()) ?? s);
}

/** Tom tat rule-based cua worker (khi khong cau hinh LLM) chi lap lai diem + ky nang da hien. */
export function isRuleBasedSummary(summary: string): boolean {
  return summary.startsWith('Diem phu hop:');
}

/** "Java, Spring Boot,, java " -> ["Java", "Spring Boot"] (bo trong, bo trung khong phan biet hoa thuong). */
export function parseSkills(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(',')) {
    const skill = part.trim();
    const key = skill.toLowerCase();
    if (skill && !seen.has(key)) {
      seen.add(key);
      result.push(skill);
    }
  }
  return result;
}

const tokens = (skill: string) => new Set(skill.split(/\s+/).filter(Boolean));
const isSubset = (a: Set<string>, b: Set<string>) => [...a].every((t) => b.has(t));

/**
 * AI co cham duoc ky nang nay khong? PHAI giong ai-worker/app/nlp/matcher.py: ky nang yeu cau `req`
 * chi khop duoc khi CV chua mot ky nang `s` trong tu dien sao cho
 * s == req, hoac tap tu cua req nam trong s, hoac tap tu cua s nam trong req.
 * Khong co `s` nao nhu vay -> moi CV deu bi tinh la THIEU ky nang nay.
 */
export function isRecognizedSkill(skill: string, dictionary: readonly string[]): boolean {
  const req = skill.trim().toLowerCase();
  if (!req) return true;
  const reqTokens = tokens(req);
  return dictionary.some((s) => {
    const sTokens = tokens(s);
    return s === req || isSubset(reqTokens, sTokens) || isSubset(sTokens, reqTokens);
  });
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = current;
    }
  }
  return row[b.length];
}

/** Goi y ten AI nhan ra cho ky nang bi go khac di (vd "ReactJS" -> "react", "Postgres" -> "postgresql"). */
export function suggestSkills(skill: string, dictionary: readonly string[], limit = 3): string[] {
  const q = skill.trim().toLowerCase().replace(/[\s.-]+/g, '');
  if (q.length < 2) return [];
  return dictionary
    .map((d) => {
      const compact = d.replace(/[\s.-]+/g, '');
      const contains = compact.length >= 2 && (q.includes(compact) || compact.includes(q));
      return { d, rank: contains ? 0 : editDistance(q, compact) };
    })
    .filter(({ rank }) => rank <= (q.length >= 6 ? 2 : 1))
    .sort((a, b) => a.rank - b.rank || a.d.length - b.d.length)
    .slice(0, limit)
    .map(({ d }) => d);
}
