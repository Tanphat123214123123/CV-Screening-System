import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropZone from './DropZone';
import ScoreRing from './ScoreRing';
import SkillChips from './SkillChips';

describe('ScoreRing', () => {
  it('doc diem va muc phu hop cho trinh doc man hinh', () => {
    render(<ScoreRing score={92} status="PROCESSED" showLabel />);
    expect(screen.getByRole('img', { name: /92 trên 100 — Rất phù hợp/ })).toBeInTheDocument();
    expect(screen.getByText('Rất phù hợp')).toBeInTheDocument();
  });

  it('hien trang thai dang phan tich va loi', () => {
    const { rerender } = render(<ScoreRing score={null} status="PENDING" />);
    expect(screen.getByRole('img', { name: 'AI đang phân tích' })).toBeInTheDocument();
    rerender(<ScoreRing score={null} status="FAILED" />);
    expect(screen.getByRole('img', { name: /không đọc được/ })).toBeInTheDocument();
  });
});

describe('SkillChips', () => {
  it('gom phan vuot qua max thanh +n', () => {
    render(<SkillChips skills={['A', 'B', 'C', 'D']} max={2} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});

describe('DropZone', () => {
  function Harness() {
    const [file, setFile] = useState<File | null>(null);
    return <DropZone file={file} onFileChange={setFile} />;
  }

  it('tu choi file .doc va nhan file PDF', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<Harness />);
    const input = screen.getByLabelText(/Kéo thả CV/);

    await user.upload(input, new File(['x'], 'cv.doc'));
    expect(screen.getByRole('alert')).toHaveTextContent('.docx');

    await user.upload(input, new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }));
    expect(screen.getByText('cv.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bỏ file đã chọn' })).toBeInTheDocument();
  });
});
