/** Logo: cai sang loc - vai CV (cham tron) nam lai, mot "hat vang" lot qua. */
export default function SieveMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-forest" />
      <path
        d="M7 12h18l-4 10a3 3 0 0 1-2.8 2h-4.4A3 3 0 0 1 11 22z"
        fill="none"
        stroke="rgb(226 238 231)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="16" r="1.4" fill="rgb(226 238 231)" />
      <circle cx="19" cy="16" r="1.4" fill="rgb(226 238 231)" />
      <circle cx="16" cy="19.5" r="1.4" fill="rgb(226 238 231)" opacity="0.5" />
      <circle cx="16" cy="28" r="2" className="fill-amber" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-semibold tracking-tight ${className}`}>
      Talent<span className="accent-italic text-amber">Sift</span>
    </span>
  );
}
