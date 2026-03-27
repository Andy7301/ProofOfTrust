type JsonPanelProps = {
  title: string;
  payload: unknown;
};

export function JsonPanel({ title, payload }: JsonPanelProps) {
  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-content-muted">{title}</h3>
      <pre className="max-h-64 overflow-auto rounded-xl border border-glass-border bg-black/40 p-4 font-mono text-xs text-solana">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}
