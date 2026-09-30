import { Link } from 'react-router-dom';
import { ArrowRight, FileSearch, ListOrdered, MessageSquareQuote, Sparkles, Target, UploadCloud, Users } from 'lucide-react';
import SiftHero from '../components/brand/SiftHero';
import ScoreRing from '../components/ui/ScoreRing';
import SkillChips from '../components/ui/SkillChips';

const steps = [
  {
    Icon: Target,
    title: 'HR đăng tin & kỹ năng',
    text: 'Liệt kê kỹ năng cần có — đó là thước đo AI dùng để chấm từng CV.',
  },
  {
    Icon: UploadCloud,
    title: 'Ứng viên gửi CV',
    text: 'Kéo thả PDF hoặc DOCX. File được lưu trên S3, đưa vào hàng đợi SQS.',
  },
  {
    Icon: Sparkles,
    title: 'AI đọc, chấm, xếp hạng',
    text: 'Worker Python trích xuất kỹ năng, kinh nghiệm, chấm 0–100 và viết nhận xét.',
  },
];

export default function Landing() {
  return (
    <div className="-mt-2 space-y-24 sm:space-y-32">
      {/* ---------- Hero ---------- */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up">
          <p className="eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss/5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Sàng lọc CV bằng AI
          </p>
          <h1 className="text-5xl font-semibold leading-[1.05] sm:text-6xl xl:text-7xl">
            Hàng trăm CV.
            <br />
            <span className="accent-italic">Một</span> danh sách
            <br />
            <span className="whitespace-nowrap">ngắn, đáng đọc.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink/65">
            TalentSift đọc từng CV, so với yêu cầu của bạn, chấm điểm độ phù hợp và chỉ ra kỹ năng còn
            thiếu — để bạn dành thời gian cho những người thực sự đáng gặp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Bắt đầu miễn phí <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn-outline px-6 py-3 text-base">Tôi đã có tài khoản</Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-6">
            {[
              ['0–100', 'điểm phù hợp'],
              ['Vài giây', 'để có kết quả'],
              ['PDF, DOCX', 'định dạng hỗ trợ'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="whitespace-nowrap font-display text-2xl font-semibold">{value}</dd>
                <dd className="text-xs text-ink/50">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <SiftHero />
      </section>

      {/* ---------- Cach hoat dong ---------- */}
      <section aria-labelledby="how-title">
        <p className="eyebrow mb-3">Cách hoạt động</p>
        <h2 id="how-title" className="max-w-xl text-4xl font-semibold leading-tight">
          Ba bước, từ <span className="accent-italic">tin tuyển dụng</span> đến danh sách xếp hạng.
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="relative">
              {i < steps.length - 1 && (
                <span className="absolute left-16 right-0 top-7 hidden border-t-2 border-dashed border-ink/10 md:block" aria-hidden="true" />
              )}
              <div className="relative flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest text-cream shadow-card">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="font-display text-5xl italic text-ink/10">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-ink/60">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Bento: HR nhan duoc gi ---------- */}
      <section aria-labelledby="features-title">
        <p className="eyebrow mb-3">Dành cho nhà tuyển dụng</p>
        <h2 id="features-title" className="max-w-xl text-4xl font-semibold leading-tight">
          Không chỉ một con số — mà là <span className="accent-italic">lý do</span> đằng sau nó.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-6">
          <article className="card flex items-center gap-6 p-6 md:col-span-3">
            <ScoreRing score={86} status="PROCESSED" size="md" showLabel />
            <div>
              <h3 className="text-lg font-semibold">Điểm phù hợp 0–100</h3>
              <p className="mt-1 text-sm text-ink/60">Kết hợp độ phủ kỹ năng và số năm kinh nghiệm, cập nhật trực tiếp khi AI xử lý xong.</p>
            </div>
          </article>
          <article className="card p-6 md:col-span-3">
            <FileSearch className="h-5 w-5 text-moss" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">Kỹ năng khớp & còn thiếu</h3>
            <div className="mt-3 space-y-2">
              <SkillChips skills={['Java', 'Spring Boot', 'PostgreSQL']} variant="matched" size="sm" />
              <SkillChips skills={['Kafka', 'Kubernetes']} variant="missing" size="sm" />
            </div>
          </article>
          <article className="card p-6 md:col-span-4">
            <MessageSquareQuote className="h-5 w-5 text-moss" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">Nhận xét như một đồng nghiệp</h3>
            <blockquote className="mt-3 border-l-2 border-amber pl-4 font-display text-lg italic text-ink/75">
              “Nền tảng Spring Boot vững, đã triển khai trên AWS. Cần hỏi thêm về kinh nghiệm message queue.”
            </blockquote>
          </article>
          <article className="card bg-forest p-6 text-cream md:col-span-2">
            <ListOrdered className="h-5 w-5 text-amber" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">Xếp hạng & shortlist</h3>
            <p className="mt-2 text-sm text-cream/70">Lọc theo ngưỡng điểm, đánh dấu Shortlist hoặc Loại chỉ bằng một cú bấm.</p>
          </article>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-14 text-center text-cream sm:px-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-moss/40 blur-3xl" aria-hidden="true" />
        <Users className="mx-auto h-8 w-8 text-amber" aria-hidden="true" />
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white">
          Để AI đọc CV — bạn dành thời gian <span className="whitespace-nowrap font-display italic text-amber">phỏng vấn</span>.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn-accent px-6 py-3 text-base">
            Tạo tài khoản <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/login" className="btn border border-cream/25 px-6 py-3 text-base text-cream hover:bg-cream/10">
            Đăng nhập
          </Link>
        </div>
      </section>
    </div>
  );
}
