/** Test cac luong UX: het phien, phim tat xet duyet, canh bao ky nang, ung vien, loi theo o, tien trinh upload. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { AppRoutes } from './App';
import { AUTH_EXPIRED_EVENT } from './services/api';
import * as authService from './services/authService';
import * as cvService from './services/cvService';
import * as jobService from './services/jobService';
import * as skillService from './services/skillService';
import { candidateUser, hrUser, renderWithProviders } from './test/utils';
import type { CandidateMatch, Job, MyApplication, MyJob } from './types';

vi.mock('./services/authService');
vi.mock('./services/jobService');
vi.mock('./services/cvService');
vi.mock('./services/skillService');

const now = new Date().toISOString();
const baseJob: Job = {
  id: 1, title: 'Java Backend', description: 'Mo ta', requiredSkills: 'Java, Spring Boot, Tiếng Anh',
  location: 'HCM', active: true, createdAt: now,
};
const myJob: MyJob = { ...baseJob, applicantCount: 2, pendingCount: 0, strongCount: 1, shortlistedCount: 0, averageScore: 60 };

const candidate = (over: Partial<CandidateMatch>): CandidateMatch => ({
  cvId: 10, candidateName: 'An Nguyen', candidateEmail: 'an@x.com', fileName: 'cv.pdf', status: 'PROCESSED',
  reviewStatus: 'NEW', score: 76, matchedSkills: 'java, spring boot', missingSkills: 'tiếng anh', summary: null,
  yearsExperience: 4, uploadedAt: now, reviewedAt: null, ...over,
});

const application = (over: Partial<MyApplication>): MyApplication => ({
  cvId: 1, jobId: 1, jobTitle: 'Java Backend', fileName: 'cv.pdf', status: 'PROCESSED', reviewStatus: 'NEW',
  fitLevel: 'HIGH', matchedSkills: 'java', missingSkills: 'aws', uploadedAt: now, ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(skillService.getSkillDictionary).mockResolvedValue(['java', 'spring boot', 'react', 'aws']);
});

describe('xet duyet ung vien (HR)', () => {
  beforeEach(() => {
    vi.mocked(jobService.getMyJobs).mockResolvedValue([myJob]);
    vi.mocked(cvService.getCandidatesForJob).mockResolvedValue([
      // 2/3 ky nang * 80 + 4 nam * 4 = 69.3 (dung cong thuc cua worker)
      candidate({ cvId: 10, candidateName: 'An Nguyen', score: 69.3 }),
      candidate({ cvId: 11, candidateName: 'Binh Tran', score: 52, matchedSkills: 'java', missingSkills: 'spring boot, tiếng anh', yearsExperience: 3 }),
    ]);
    vi.mocked(cvService.updateReviewStatus).mockResolvedValue();
  });

  it('phim S shortlist ho so dang xem roi tu chuyen sang ho so ke tiep; K quay lai', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/hr/jobs/1?cv=10', user: hrUser });
    expect(await screen.findByRole('heading', { name: 'An Nguyen' })).toBeInTheDocument();

    await user.keyboard('s');
    expect(cvService.updateReviewStatus).toHaveBeenCalledWith(10, 'SHORTLISTED');
    expect(await screen.findByRole('heading', { name: 'Binh Tran' })).toBeInTheDocument();

    await user.keyboard('k');
    expect(await screen.findByRole('heading', { name: 'An Nguyen' })).toBeInTheDocument();
  });

  it('khong nhan phim tat khi dang go vao o tim kiem', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/hr/jobs/1?cv=10', user: hrUser });
    await screen.findByRole('heading', { name: 'An Nguyen' });

    await user.type(screen.getByLabelText('Tìm ứng viên'), 's');
    expect(cvService.updateReviewStatus).not.toHaveBeenCalled();
  });

  it('giai thich diem va chi ra ky nang "thieu" do AI khong nhan dien duoc; khong lo huong dan cho dev', async () => {
    renderWithProviders(<AppRoutes />, { route: '/hr/jobs/1?cv=10', user: hrUser });
    const why = await screen.findByRole('region', { name: 'Vì sao 69.3 điểm?' });
    expect(why).toHaveTextContent('2/3 yêu cầu × 80');
    expect(why).toHaveTextContent('4 năm × 4');
    expect(await screen.findByText(/AI không nhận diện được Tiếng Anh nên luôn tính là thiếu/)).toBeInTheDocument();
    expect(screen.queryByText(/ANTHROPIC_API_KEY/)).not.toBeInTheDocument();
  });
});

describe('form dang tin: canh bao ky nang AI khong nhan ra', () => {
  it('liet ke ky nang khong nhan dien duoc va cho bam goi y de thay', async () => {
    vi.mocked(jobService.getMyJobs).mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/hr', user: hrUser });

    await user.click((await screen.findAllByRole('button', { name: /Đăng tin mới/ }))[0]);
    const skills = screen.getByLabelText('Kỹ năng yêu cầu');
    await user.type(skills, 'Java, Tiếng Anh, ReactJS');

    expect(await screen.findByText('AI chưa nhận diện được: Tiếng Anh, ReactJS')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'react' }));
    expect(skills).toHaveValue('Java, Tiếng Anh, react');
    expect(screen.getByText('AI chưa nhận diện được: Tiếng Anh')).toBeInTheDocument();
  });

  it('tu luu ban nhap: dong hop thoai roi mo lai van con noi dung', async () => {
    vi.mocked(jobService.getMyJobs).mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/hr', user: hrUser });

    await user.click((await screen.findAllByRole('button', { name: /Đăng tin mới/ }))[0]);
    await user.type(screen.getByLabelText('Vị trí'), 'Data Engineer');
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    await user.click(screen.getAllByRole('button', { name: /Đăng tin mới/ })[0]);

    expect(screen.getByLabelText('Vị trí')).toHaveValue('Data Engineer');
    expect(screen.getByText(/Đã khôi phục bản nháp/)).toBeInTheDocument();
  });
});

describe('het phien dang nhap', () => {
  it('ve trang dang nhap roi quay lai dung ho so dang xem sau khi dang nhap lai', async () => {
    vi.mocked(jobService.getMyJobs).mockResolvedValue([myJob]);
    vi.mocked(cvService.getCandidatesForJob).mockResolvedValue([candidate({ cvId: 10, candidateName: 'An Nguyen' })]);
    vi.mocked(authService.login).mockResolvedValue(hrUser);
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/hr/jobs/1?cv=10', user: hrUser });
    await screen.findByRole('heading', { name: 'An Nguyen' });

    // Vai request song song cung nhan 401 -> chi 1 thong bao
    const warning = vi.spyOn(toast, 'warning');
    act(() => {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    });

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(warning).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('auth')).toBeNull();
    await user.type(screen.getByLabelText('Email'), 'hr@demo.com');
    await user.type(screen.getByLabelText('Mật khẩu'), '123456');
    await user.click(screen.getByRole('button', { name: /^Đăng nhập/ }));

    expect(await screen.findByRole('heading', { name: 'An Nguyen' })).toBeInTheDocument();
  });
});

describe('ung vien thay ket qua xet duyet thay vi diem so', () => {
  it('hien ho so duoc chon, muc phu hop, va nut nop lai khi CV loi', async () => {
    vi.mocked(jobService.getJobs).mockResolvedValue([baseJob]);
    vi.mocked(cvService.getMyApplications).mockResolvedValue([
      application({ cvId: 1, jobId: 1, jobTitle: 'Java Backend', reviewStatus: 'SHORTLISTED' }),
      application({ cvId: 2, jobId: 2, jobTitle: 'Data Engineer', status: 'FAILED', fitLevel: null }),
    ]);
    renderWithProviders(<AppRoutes />, { route: '/my-applications', user: candidateUser });

    expect(await screen.findByText('Hồ sơ được chọn')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mức độ phù hợp theo AI: Rất phù hợp' })).toBeInTheDocument();
    expect(screen.queryByText(/\/\s?100/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nộp lại CV/ })).toHaveAttribute('href', '/jobs/2');
  });

  it('CV loi: trang chi tiet tin cho nop lai, co thanh tien trinh upload', async () => {
    vi.mocked(jobService.getJob).mockResolvedValue(baseJob);
    vi.mocked(cvService.getMyApplications).mockResolvedValue([application({ status: 'FAILED', fitLevel: null })]);
    vi.mocked(cvService.uploadCv).mockImplementation((_jobId, _file, onProgress) => {
      onProgress?.(40);
      return new Promise(() => {}); // van dang tai
    });
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<AppRoutes />, { route: '/jobs/1', user: candidateUser });

    expect(await screen.findByText('Không đọc được CV')).toBeInTheDocument();
    await user.upload(screen.getByLabelText(/Kéo thả CV/), new File(['%PDF'], 'cv-moi.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: /Gửi CV mới/ }));

    expect(cvService.uploadCv).toHaveBeenCalledWith(1, expect.any(File), expect.any(Function));
    expect(await screen.findByRole('progressbar', { name: 'Tiến trình tải CV lên' })).toHaveAttribute('aria-valuenow', '40');
  });
});

describe('dang ky', () => {
  it('doi vai tro xoa ma moi da go; loi server hien ngay duoi o tuong ung', async () => {
    vi.mocked(authService.register).mockRejectedValue(Object.assign(new Error('400'), {
      isAxiosError: true,
      response: { status: 400, data: { message: 'x', fieldErrors: { email: 'Email đã được sử dụng.' } } },
    }));
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/register' });

    await user.click(screen.getByRole('button', { name: /Nhà tuyển dụng/ }));
    await user.type(screen.getByLabelText('Mã mời nhà tuyển dụng'), 'SECRET');
    await user.click(screen.getByRole('button', { name: /Ứng viên/ }));
    await user.click(screen.getByRole('button', { name: /Nhà tuyển dụng/ }));
    expect(screen.getByLabelText('Mã mời nhà tuyển dụng')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /Ứng viên/ }));
    await user.type(screen.getByLabelText('Họ và tên'), 'An');
    await user.type(screen.getByLabelText('Email'), 'an@x.com');
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'matkhau123');
    await user.click(screen.getByRole('button', { name: /^Đăng ký/ }));

    const email = screen.getByLabelText('Email');
    expect(await screen.findByText('Email đã được sử dụng.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(within(screen.getByRole('main')).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('email da ton tai (409) hien duoi o Email', async () => {
    vi.mocked(authService.register).mockRejectedValue(Object.assign(new Error('409'), {
      isAxiosError: true,
      response: { status: 409, data: { message: 'Email đã được sử dụng.' } },
    }));
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/register' });
    await user.type(screen.getByLabelText('Họ và tên'), 'An');
    await user.type(screen.getByLabelText('Email'), 'an@x.com');
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'matkhau123');
    await user.click(screen.getByRole('button', { name: /^Đăng ký/ }));

    expect(await screen.findByText('Email đã được sử dụng.')).toHaveAttribute('id', 'reg-email-error');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('nut hien / an mat khau', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: '/login' });
    const password = screen.getByLabelText('Mật khẩu', { exact: true });
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
