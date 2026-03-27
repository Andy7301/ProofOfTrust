export function RequestForm() {
  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-slate-300">
        New Purchase Request
      </h3>
      <div className="mt-4 grid gap-3">
        <input
          className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50"
          placeholder="Request description"
        />
        <input
          className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50"
          placeholder="Target service / endpoint"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50"
            placeholder="Expected cost (USD)"
          />
          <select className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50">
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>
        <button className="mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
          Verify + Evaluate Credit
        </button>
      </div>
    </section>
  );
}
