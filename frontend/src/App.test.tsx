import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AppRoutes } from './App';
import { candidateUser, hrUser, renderWithProviders } from './test/utils';
import * as cvService from './services/cvService';
import * as jobService from './services/jobService';
import type { Job, MyApplication, MyJob } from './types';

vi.mock('./services/jobService');
vi.mock('./services/cvService');

const job = (id: number, title: string): Job => ({
  id, title, description: 'Mo ta', requiredSkills: 'Java, Spring Boot', location: 'HCM', active: true,
  createdAt: new Date().toISOString(),
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('dieu huong', () => {
  it('khach chua dang nhap vao "/" thay trang gioi thieu', () => {
    renderWithProviders(<AppRoutes />, { route: '/' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Hàng trăm CV/);
  });

  it('duong dan khong ton tai hien trang 404', () => {
    renderWithProviders(<AppRoutes />, { route: '/khong-co-trang-nay' });
    expect(screen.getByText('Trang này đã lọt qua sàng.')).toBeInTheDocument();
  });

  it('chua dang nhap ma vao trang can quyen thi ve trang dang nhap', () => {
    renderWithProviders(<AppRoutes />, { route: '/hr' });
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('HR vao trang cua ung vien bi chuyen ve tong quan', async () => {
    vi.mocked(jobService.getMyJobs).mockResolvedValue([]);
    renderWithProviders(<AppRoutes />, { route: '/jobs', user: hrUser });
    expect(await screen.findByText('Bạn chưa đăng tin nào')).toBeInTheDocument();
    // HR chi thay tin cua minh -> khong goi API danh sach tin cua moi HR
    expect(jobService.getMyJobs).toHaveBeenCalled();
    expect(jobService.getJobs).not.toHaveBeenCalled();
  });
});

describe('ung vien', () => {
  it('danh dau "Da nop" dung tin da ung tuyen', async () => {
    vi.mocked(jobService.getJobs).mockResolvedValue([job(1, 'Java Backend'), job(2, 'React Frontend')]);
    vi.mocked(cvService.getMyApplications).mockResolvedValue([
      { cvId: 9, jobId: 1, jobTitle: 'Java Backend', fileName: 'cv.pdf', status: 'PROCESSED',
        reviewStatus: 'NEW', fitLevel: 'HIGH',
        matchedSkills: 'Java', missingSkills: null, uploadedAt: new Date().toISOString() } satisfies MyApplication,
    ]);

    renderWithProviders(<AppRoutes />, { route: '/jobs', user: candidateUser });

    const applied = await screen.findByRole('link', { name: /Java Backend/ });
    expect(applied).toHaveTextContent('Đã nộp');
    expect(screen.getByRole('link', { name: /React Frontend/ })).not.toHaveTextContent('Đã nộp');
  });

  it('bao loi va cho thu lai khi khong tai duoc tin', async () => {
    vi.mocked(jobService.getJobs).mockRejectedValue(new Error('network'));
    vi.mocked(cvService.getMyApplications).mockResolvedValue([]);

    renderWithProviders(<AppRoutes />, { route: '/jobs', user: candidateUser });

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được danh sách việc làm');
    expect(screen.queryByText('Chưa có tin tuyển dụng')).not.toBeInTheDocument();
  });
});

describe('HR', () => {
  it('tong quan hien so lieu cong don tu cac tin', async () => {
    const mine: MyJob[] = [
      { ...job(1, 'Java Backend'), applicantCount: 5, pendingCount: 1, strongCount: 2, shortlistedCount: 1, averageScore: 66.4 },
      { ...job(2, 'Tin cu'), active: false, applicantCount: 3, pendingCount: 0, strongCount: 1, shortlistedCount: 0, averageScore: null },
    ];
    vi.mocked(jobService.getMyJobs).mockResolvedValue(mine);

    renderWithProviders(<AppRoutes />, { route: '/hr', user: hrUser });

    await screen.findByText('Tổng hồ sơ');
    const stats = screen.getByRole('region', { name: 'Số liệu tổng quan' });
    expect(stats).toHaveTextContent('Tổng hồ sơ8');
    expect(stats).toHaveTextContent('1 tin đã đóng');
    // Tab mac dinh "Dang tuyen" chi hien tin dang mo
    expect(screen.getByRole('link', { name: 'Java Backend' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tin cu' })).not.toBeInTheDocument();
  });
});
