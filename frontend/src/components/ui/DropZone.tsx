import { useId, useRef, useState, type DragEvent } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { CV_ACCEPT_ATTR, formatBytes, validateCvFile } from '../../lib/file';

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

/** Vung keo-tha / chon file CV, kiem tra dinh dang + dung luong ngay tai client. */
export default function DropZone({ file, onFileChange, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = validateCvFile(candidate);
    setError(problem);
    onFileChange(problem ? null : candidate);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) pick(e.dataTransfer.files[0]);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-moss/30 bg-moss/5 p-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-moss text-paper">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="text-xs text-ink/55">{formatBytes(file.size)} · sẵn sàng gửi</p>
        </div>
        <button
          type="button"
          onClick={() => onFileChange(null)}
          disabled={disabled}
          className="btn-ghost h-9 w-9 p-0"
          aria-label="Bỏ file đã chọn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
          dragging ? 'scale-[1.01] border-moss bg-moss/10' : 'border-ink/15 hover:border-moss/50 hover:bg-moss/5'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <span
          className={`grid h-12 w-12 place-items-center rounded-full bg-mint text-moss transition ${
            dragging ? '-translate-y-1' : 'group-hover:-translate-y-0.5'
          }`}
        >
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="mt-3 text-sm font-semibold">
          {dragging ? 'Thả file vào đây' : 'Kéo thả CV vào đây'}
        </span>
        <span className="mt-0.5 text-xs text-ink/55">
          hoặc <span className="font-semibold text-moss underline-offset-2 group-hover:underline">chọn từ máy</span> · PDF, DOCX · tối đa 5MB
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={CV_ACCEPT_ATTR}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
