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
