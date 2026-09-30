import type { ReactNode } from 'react';
import ScoreRing from '../ui/ScoreRing';
import SkillChips from '../ui/SkillChips';

/** Bo cuc chia doi cho dang nhap / dang ky: form ben trai, panel thuong hieu ben phai. */
export default function AuthLayout({ title, subtitle, children }: { title: ReactNode; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-ink/[0.07] bg-surface shadow-lift lg:grid-cols-2">
      <div className="animate-fade-up p-7 sm:p-12">
        <h1 className="text-4xl font-semibold leading-tight">{title}</h1>
        <p className="mb-8 mt-2 text-ink/60">{subtitle}</p>
        {children}
      </div>

      <aside className="relative hidden overflow-hidden bg-forest p-12 text-cream lg:block" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-moss/50 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <p className="font-display text-3xl italic leading-snug text-white">
            200 CV mỗi đợt tuyển? Hãy bắt đầu từ 20 hồ sơ đứng đầu.
          </p>

          <div className="relative h-56">
            <div className="absolute left-0 top-0 w-64 rotate-[-4deg] rounded-2xl bg-surface p-4 text-ink shadow-lift">
              <div className="flex items-center gap-3">
                <ScoreRing score={88} status="PROCESSED" size="sm" />
                <div>
                  <p className="text-sm font-semibold">Ngô Gia Huy</p>
                  <p className="text-xs text-ink/50">Backend Developer</p>
                </div>
              </div>
              <div className="mt-3">
                <SkillChips skills={['Java', 'Spring Boot', 'Docker']} variant="matched" size="sm" />
              </div>
            </div>
            <div className="absolute bottom-0 right-2 w-56 rotate-[3deg] rounded-2xl bg-surface p-4 text-ink shadow-lift">
              <div className="flex items-center gap-3">
                <ScoreRing score={57} status="PROCESSED" size="sm" />
                <div>
                  <p className="text-sm font-semibold">Mai Khánh Linh</p>
                  <p className="text-xs text-ink/50">Còn thiếu 2 kỹ năng</p>
                </div>
              </div>
              <div className="mt-3">
                <SkillChips skills={['AWS', 'Kafka']} variant="missing" size="sm" />
              </div>
            </div>
          </div>

          <p className="text-sm text-cream/60">TalentSift · Sàng lọc CV bằng AI</p>
        </div>
      </aside>
    </div>
  );
}
