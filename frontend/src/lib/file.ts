/** Khop voi backend: spring.servlet.multipart.max-file-size = 5MB. */
export const MAX_CV_BYTES = 5 * 1024 * 1024;

/**
 * Chi nhan PDF va DOCX. Khong nhan .doc (Word 97-2003): AI worker doc bang
 * python-docx, thu vien nay chi hieu .docx nen file .doc se luon bi FAILED.
 */
export const ACCEPTED_CV_EXTENSIONS = ['pdf', 'docx'] as const;
export const CV_ACCEPT_ATTR = '.pdf,.docx';

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/** Tra ve thong bao loi, hoac null neu file hop le. */
export function validateCvFile(file: Pick<File, 'name' | 'size'>): string | null {
  const ext = fileExtension(file.name);
  if (ext === 'doc') {
    return 'File .doc (Word 97-2003) chưa được hỗ trợ. Hãy lưu lại dưới dạng .docx hoặc PDF.';
  }
  if (!(ACCEPTED_CV_EXTENSIONS as readonly string[]).includes(ext)) {
    return 'Chỉ nhận file PDF hoặc DOCX.';
  }
  if (file.size === 0) return 'File rỗng, hãy chọn file khác.';
  if (file.size > MAX_CV_BYTES) return 'File vượt quá 5MB.';
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
