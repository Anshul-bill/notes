// ShareNotes mark: a note sheet whose top line is a highlighter swipe (the brand gesture).
export default function Logo({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* sheet */}
      <rect x="4" y="2.5" width="16" height="19" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      {/* highlighter swipe (brand accent) */}
      <rect x="7" y="7" width="10" height="3" rx="1.5" fill="var(--accent)" />
      {/* text lines */}
      <line x1="7.5" y1="13.5" x2="15" y2="13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
      <line x1="7.5" y1="16.5" x2="12.5" y2="16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}
