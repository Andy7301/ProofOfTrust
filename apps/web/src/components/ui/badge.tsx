type BadgeProps = {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
};

const toneMap: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
  success: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  danger: "border-rose-300/30 bg-rose-300/10 text-rose-200"
};

export function Badge({ label, tone = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
