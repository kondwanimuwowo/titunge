const TONES = {
  amber: { text: "text-amber-700", dot: "bg-amber-500" },
  emerald: { text: "text-emerald-700", dot: "bg-emerald-500" },
  red: { text: "text-red-700", dot: "bg-red-500" },
  blue: { text: "text-blue-700", dot: "bg-blue-500" },
  indigo: { text: "text-indigo-700", dot: "bg-indigo-500" },
  teal: { text: "text-teal-700", dot: "bg-teal-500" },
  purple: { text: "text-purple-700", dot: "bg-purple-500" },
  orange: { text: "text-orange-700", dot: "bg-orange-500" },
  gray: { text: "text-gray-600", dot: "bg-gray-400" },
} as const;

export type StatusTone = keyof typeof TONES;

interface StatusDotProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

/** Status shown as colored text with a small dot — no pill background. */
export function StatusDot({ label, tone = "gray", className = "" }: StatusDotProps) {
  const t = TONES[tone] ?? TONES.gray;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${t.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.dot}`} />
      {label}
    </span>
  );
}
