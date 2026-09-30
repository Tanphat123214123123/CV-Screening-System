import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types';

/** Lay thong bao loi than thien tu loi axios / backend (body ApiError). */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.';
    if (error.response.status === 413) return 'File quá lớn (tối đa 5MB).';
    const message = (error.response.data as Partial<ApiErrorBody> | undefined)?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

/** Loi validate theo tung truong backend tra ve (ApiError.fieldErrors), rong neu khong co. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (isAxiosError(error)) {
    const fieldErrors = (error.response?.data as Partial<ApiErrorBody> | undefined)?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') return fieldErrors;
  }
  return {};
}
