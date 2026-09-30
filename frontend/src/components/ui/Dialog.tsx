import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}

/**
 * Hop thoai dung <dialog> goc cua trinh duyet: co san focus trap, Esc de dong,
 * va aria-modal - khong can thu vien ngoai.
 */
export function Dialog({ open, onClose, title, description, children, wide = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Bam ra vung nen mo (ngoai khung) thi dong
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-3xl border border-ink/10 bg-surface p-0 text-ink shadow-lift backdrop:bg-forest/50 backdrop:backdrop-blur-sm open:animate-fade-up`}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="text-2xl font-semibold">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
            </div>
            <button onClick={onClose} className="btn-ghost -mr-2 -mt-1 h-9 w-9 p-0" aria-label="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  pending = false,
  onConfirm,
  onClose,
}: ConfirmProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">Huỷ</button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className={tone === 'danger' ? 'btn bg-clay text-paper hover:brightness-110' : 'btn-primary'}
        >
          {pending ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
