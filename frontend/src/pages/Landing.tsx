import { Link } from 'react-router-dom';
import ScoreBadge from '../components/common/ScoreBadge';

const steps = [
  {
    title: 'Đăng tin & khai báo kỹ năng',
    desc: 'Nhà tuyển dụng tạo tin tuyển dụng và liệt kê rõ những kỹ năng bắt buộc — đây là "đề bài" để AI đối chiếu ở bước sau.',
  },
  {
    title: 'Ứng viên nộp CV',
    desc: 'Chỉ cần tải lên một file PDF hoặc DOCX. Không cần điền lại thông tin thủ công, không cần tạo hồ sơ dài dòng.',
  },
  {
    title: 'AI đọc, chấm điểm & xếp hạng',
    desc: 'Hệ thống phân tích từng hồ sơ, đối chiếu với yêu cầu công việc, gắn điểm phù hợp và liệt kê kỹ năng khớp/còn thiếu để nhà tuyển dụng duyệt nhanh hơn.',
  },
];

const hrFeatures = [
  'Đăng và đóng tin tuyển dụng chỉ trong vài giây.',
  'Ứng viên tự động xếp hạng theo điểm phù hợp AI chấm — cao nhất lên đầu.',
  'Xem ngay kỹ năng khớp, kỹ năng còn thiếu và số năm kinh nghiệm ước tính.',
  'Tải CV gốc (PDF/DOCX) của bất kỳ ứng viên nào chỉ với một cú click.',
];

const candidateFeatures = [
  'Duyệt toàn bộ việc làm đang mở tại một nơi duy nhất.',
  'Nộp CV chỉ với một lần tải lên — giữ nguyên file PDF hoặc DOCX của bạn.',
  'Theo dõi trạng thái xử lý theo thời gian thực, không cần hỏi lại nhà tuyển dụng.',
  'Nhận điểm phù hợp minh bạch kèm lý do, không phải một con số vô nghĩa.',
];

const stats = [
  { value: '< 30s', label: 'để AI chấm điểm mỗi CV' },
  { value: 'PDF · DOCX', label: 'định dạng hồ sơ hỗ trợ' },
  { value: '2 vai trò', label: 'ứng viên & nhà tuyển dụng' },
  { value: '100%', label: 'minh bạch kỹ năng khớp/thiếu' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink">
            Talent<em className="text-moss not-italic">Sift</em>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#quy-trinh" className="eyebrow text-ink/50 transition-colors duration-200 hover:text-ink">
              Quy trình
            </a>
            <a href="#tinh-nang" className="eyebrow text-ink/50 transition-colors duration-200 hover:text-ink">
              Tính năng
            </a>
          </nav>
          <div className="flex items-center gap-5">
            <Link to="/login" className="eyebrow text-ink/60 transition-colors duration-200 hover:text-ink">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div className="animate-fade-up">
              <span className="eyebrow text-moss">TalentSift · Nền tảng sàng lọc CV bằng AI</span>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
                Ngừng đọc CV.
                <br />
                Bắt đầu đọc
                <br />
                <em className="text-moss not-italic">kết quả.</em>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-ink/60">
                AI đối chiếu từng hồ sơ với yêu cầu công việc, chấm điểm và xếp hạng ứng viên — để đội
                tuyển dụng chỉ tập trung vào những hồ sơ đáng giá nhất.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link to="/register" className="btn-primary px-6 py-3 text-base">
                  Bắt đầu miễn phí
                </Link>
                <Link
                  to="/login"
                  className="font-semibold text-ink/70 underline decoration-ink/30 underline-offset-4 transition-colors duration-200 hover:text-moss"
                >
                  Tôi đã có tài khoản
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 translate-x-5 translate-y-5 rotate-3 rounded border-2 border-ink/10 bg-paper-card" />
              <div className="panel relative -rotate-2 border-t-2 border-t-ink p-6 shadow-stamp">
                <span className="eyebrow text-ink/40">Hồ sơ ứng viên · Minh hoạ</span>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold">Đỗ Minh Khuê</p>
                    <p className="font-mono text-xs text-ink/50">Backend Developer (Java)</p>
                  </div>
                  <ScoreBadge score={92} status="PROCESSED" />
                </div>
                <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
                  <p>
                    <span className="eyebrow text-moss">Khớp </span>{' '}
                    <span className="text-ink/80">Java, Spring Boot, PostgreSQL, Docker</span>
                  </p>
                  <p>
                    <span className="eyebrow text-amber-dark">Thiếu </span>{' '}
                    <span className="text-ink/80">Kubernetes</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-ink/10 bg-paper-card/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-ink/10 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-paper-card px-6 py-8">
                <p className="font-mono text-2xl font-semibold text-ink">{s.value}</p>
                <p className="mt-1 text-sm text-ink/55">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="quy-trinh" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="eyebrow text-moss">Quy trình</span>
          <h2 className="mt-3 max-w-xl font-display text-display-lg font-semibold">
            Từ tin tuyển dụng đến hồ sơ đáng giá nhất
          </h2>
          <div className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
            {steps.map((step, i) => (
              <div key={step.title} className="grid gap-3 py-8 sm:grid-cols-[5rem_1fr] sm:gap-10">
                <span className="font-mono text-3xl font-semibold text-ink/15">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-ink/60">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features by role */}
        <section id="tinh-nang" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <span className="eyebrow text-amber-dark">Tính năng</span>
          <h2 className="mt-3 max-w-xl font-display text-display-lg font-semibold">
            Một nền tảng, hai góc nhìn
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="panel border-t-2 border-t-ink p-7 sm:p-8">
              <span className="eyebrow text-ink/40">Vai trò</span>
              <h3 className="mt-2 font-display text-2xl font-semibold">Nhà tuyển dụng</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {hrFeatures.map((f) => (
                  <li key={f} className="flex gap-3 border-t border-ink/10 pt-3 first:border-t-0 first:pt-0">
                    <span className="font-mono text-ink/30">—</span>
                    <span className="text-ink/75">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel border-t-2 border-t-moss p-7 sm:p-8">
              <span className="eyebrow text-ink/40">Vai trò</span>
              <h3 className="mt-2 font-display text-2xl font-semibold">Ứng viên</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {candidateFeatures.map((f) => (
                  <li key={f} className="flex gap-3 border-t border-ink/10 pt-3 first:border-t-0 first:pt-0">
                    <span className="font-mono text-moss/60">—</span>
                    <span className="text-ink/75">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Score transparency */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="panel border-t-2 border-t-amber p-8 sm:p-10">
            <span className="eyebrow text-amber-dark">Minh bạch</span>
            <h2 className="mt-2 font-display text-display-lg font-semibold">Điểm số không phải hộp đen</h2>
            <p className="mt-3 max-w-xl text-ink/60">
              Mỗi hồ sơ được gắn một "con dấu" điểm số rõ ràng — kèm danh sách kỹ năng khớp và còn thiếu,
              để cả nhà tuyển dụng lẫn ứng viên đều hiểu vì sao.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <ScoreBadge score={92} status="PROCESSED" />
                <span className="text-sm text-ink/60">Phù hợp cao — nên xem trước tiên</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <ScoreBadge score={55} status="PROCESSED" />
                <span className="text-sm text-ink/60">Cân nhắc — có tiềm năng, còn thiếu vài kỹ năng</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <ScoreBadge score={28} status="PROCESSED" />
                <span className="text-sm text-ink/60">Chưa sát với yêu cầu công việc hiện tại</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t-2 border-amber bg-ink py-16 text-paper sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">
              Sẵn sàng để AI đọc CV thay bạn?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-mint/70">
              Tạo tài khoản trong chưa đầy một phút — đăng tin hoặc nộp CV ngay sau đó.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <Link to="/register" className="btn-accent px-6 py-3 text-base">
                Tạo tài khoản miễn phí
              </Link>
              <Link
                to="/login"
                className="font-semibold text-mint/80 underline decoration-mint/30 underline-offset-4 transition-colors duration-200 hover:text-paper"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center">
          <Link to="/" className="font-display text-lg font-semibold text-ink">
            Talent<em className="text-amber not-italic">Sift</em>
          </Link>
          <nav className="flex gap-6 font-mono text-xs uppercase tracking-wide text-ink/50">
            <a href="#quy-trinh" className="transition-colors duration-200 hover:text-ink">
              Quy trình
            </a>
            <a href="#tinh-nang" className="transition-colors duration-200 hover:text-ink">
              Tính năng
            </a>
            <Link to="/login" className="transition-colors duration-200 hover:text-ink">
              Đăng nhập
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
