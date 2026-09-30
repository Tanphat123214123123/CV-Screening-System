import { Check, Plus } from 'lucide-react';

type Variant = 'matched' | 'missing' | 'neutral';

const styles: Record<Variant, string> = {
  matched: 'bg-moss/10 text-moss border-moss/20',
  missing: 'border-dashed border-amber/60 text-ink/70',
  neutral: 'bg-ink/[0.04] text-ink/75 border-ink/10',
};

interface Props {
  skills: string[];
  variant?: Variant;
  /** Hien toi da n chip, phan con lai gom thanh "+k". */
  max?: number;
  size?: 'sm' | 'md';
}

export default function SkillChips({ skills, variant = 'neutral', max, size = 'md' }: Props) {
  if (skills.length === 0) return null;
  const visible = max ? skills.slice(0, max) : skills;
  const hidden = skills.length - visible.length;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <ul className="flex flex-wrap gap-1.5">
      {visible.map((skill) => (
        <li
          key={skill}
          className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${styles[variant]}`}
        >
          {variant === 'matched' && <Check className="h-3 w-3" aria-hidden="true" />}
          {variant === 'missing' && <Plus className="h-3 w-3 text-amber" aria-hidden="true" />}
          {skill}
        </li>
      ))}
      {hidden > 0 && (
        <li
          className={`rounded-full border border-transparent font-medium text-ink/50 ${pad}`}
          title={skills.slice(visible.length).join(', ')}
        >
          +{hidden}
        </li>
      )}
    </ul>
  );
}
