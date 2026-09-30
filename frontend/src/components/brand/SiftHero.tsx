import ScoreRing from '../ui/ScoreRing';

/** Mot to CV thu nho bay lo lung phia tren cai sang. */
function PaperCv({ name, skills, rotate, className }: { name: string; skills: string[]; rotate: number; className: string }) {
  return (
    <div
      className={`card absolute w-40 animate-float p-3 ${className}`}
      style={{ ['--r' as string]: `${rotate}deg`, transform: `rotate(${rotate}deg)` }}
    >
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-mint" />
        <span className="text-xs font-semibold">{name}</span>
      </div>
      <div className="mt-2 space-y-1">
        <span className="block h-1.5 w-full rounded bg-ink/10" />
        <span className="block h-1.5 w-4/5 rounded bg-ink/10" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {skills.map((s) => (
          <span key={s} className="rounded-full bg-ink/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-ink/60">{s}</span>
        ))}
      </div>
    </div>
  );
}

const shortlist = [
  { name: 'Lê Minh Anh', role: 'Java · Spring Boot · AWS', score: 92 },
  { name: 'Trần Quốc Bảo', role: 'Java · Docker · SQL', score: 81 },
  { name: 'Phạm Thu Hà', role: 'Spring Boot · Kafka', score: 74 },
];

/**
 * Minh hoa hero: CV roi xuong cai sang, cham xam bi giu lai,
 * "hat vang" lot qua va thanh danh sach shortlist da duoc cham diem.
 */
export default function SiftHero() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[420px] select-none" aria-hidden="true">
      {/* CV dau vao */}
      <PaperCv name="Nguyễn Văn A" skills={['Java', 'SQL']} rotate={-8} className="left-0 top-2" />
      <PaperCv name="Đỗ Thị B" skills={['React', 'Figma']} rotate={5} className="left-[34%] top-0 [animation-delay:-1.5s]" />
      <PaperCv name="Vũ Hoàng C" skills={['Spring', 'AWS']} rotate={-3} className="right-0 top-10 [animation-delay:-3s]" />

      {/* Hat roi qua sang */}
      <div className="absolute left-1/2 top-[118px] h-24 w-56 -translate-x-1/2">
        {[8, 26, 44, 62, 80].map((left, i) => (
          <span
            key={left}
            className="absolute top-0 h-2 w-2 animate-sift rounded-full bg-ink/25"
            style={{ left: `${left}%`, animationDelay: `${i * -0.6}s` }}
          />
        ))}
      </div>

      {/* Cai sang */}
      <svg viewBox="0 0 320 90" className="absolute left-1/2 top-[178px] w-[300px] -translate-x-1/2">
        <defs>
          <pattern id="mesh" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.6" className="fill-moss/40" />
          </pattern>
        </defs>
        <ellipse cx="160" cy="14" rx="150" ry="12" className="fill-mint stroke-moss" strokeWidth="2" />
        <path d="M10 14c10 44 70 66 150 66s140-22 150-66" className="fill-surface stroke-moss" strokeWidth="2" />
        <path d="M24 22c14 34 66 50 136 50s122-16 136-50" fill="url(#mesh)" />
      </svg>

      {/* Hat vang lot qua */}
      <div className="absolute left-1/2 top-[250px] h-16 w-24 -translate-x-1/2">
        {[20, 50, 80].map((left, i) => (
          <span
            key={left}
            className="absolute top-0 h-2.5 w-2.5 animate-drop rounded-full bg-amber shadow-[0_0_12px_rgb(var(--amber)/0.7)]"
            style={{ left: `${left}%`, animationDelay: `${i * -1.05}s` }}
          />
        ))}
      </div>

      {/* Ket qua: shortlist da cham diem */}
      <div className="card absolute bottom-0 left-1/2 w-[320px] -translate-x-1/2 p-4 shadow-lift">
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">Shortlist</span>
          <span className="text-[11px] text-ink/45">3 / 48 hồ sơ</span>
        </div>
        <ul className="space-y-2.5">
          {shortlist.map((c, i) => (
            <li key={c.name} className="flex items-center gap-3">
              <span className="w-4 font-display text-sm italic text-ink/40">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-[11px] text-ink/50">{c.role}</p>
              </div>
              <ScoreRing score={c.score} status="PROCESSED" size="sm" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
