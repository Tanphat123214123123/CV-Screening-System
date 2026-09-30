import type { MyApplication } from '../types';

export type StageKey = 'analyzing' | 'unreadable' | 'waiting' | 'shortlisted' | 'rejected';

export interface Stage {
  key: StageKey;
  label: string;
  description: string;
  tone: 'amber' | 'clay' | 'ink' | 'moss';
}

/**
 * Trang thai UNG VIEN quan tam la ket qua xet duyet cua nha tuyen dung, khong phai diem AI.
 * Thu tu uu tien: AI chua doc xong / khong doc duoc -> quyet dinh cua HR -> dang cho HR.
 */
export function candidateStage(app: Pick<MyApplication, 'status' | 'reviewStatus'>): Stage {
  if (app.status === 'PENDING') {
    return {
      key: 'analyzing',
      label: 'AI đang đọc CV',
      description: 'Thường chỉ mất vài giây. Trang sẽ tự cập nhật.',
      tone: 'amber',
    };
  }
  if (app.status === 'FAILED') {
    return {
      key: 'unreadable',
      label: 'Không đọc được CV',
      description: 'File có thể là ảnh scan hoặc bị hỏng. Hãy nộp lại bản PDF / DOCX có chữ.',
      tone: 'clay',
    };
  }
  if (app.reviewStatus === 'SHORTLISTED') {
    return {
      key: 'shortlisted',
      label: 'Hồ sơ được chọn',
      description: 'Nhà tuyển dụng đã đưa bạn vào danh sách tiềm năng. Hãy để ý email của bạn.',
      tone: 'moss',
    };
  }
  if (app.reviewStatus === 'REJECTED') {
    return {
      key: 'rejected',
      label: 'Chưa phù hợp lần này',
      description: 'Cảm ơn bạn đã ứng tuyển. Các kỹ năng nên bổ sung bên dưới có thể giúp bạn ở vị trí khác.',
      tone: 'ink',
    };
  }
  return {
    key: 'waiting',
    label: 'Đang chờ nhà tuyển dụng',
    description: 'AI đã phân tích xong, hồ sơ đang chờ nhà tuyển dụng xem xét.',
    tone: 'ink',
  };
}
