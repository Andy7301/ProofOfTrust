type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-content-faint">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-content-primary">{value}</p>
      <p className="mt-1 text-sm text-content-muted">{helper}</p>
    </article>
  );
}
