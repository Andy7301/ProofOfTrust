export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wider text-cyan-300">ProofOfTrust</p>
        <h1 className="text-4xl font-semibold">AgentTab Monorepo Initialized</h1>
        <p className="max-w-2xl text-slate-300">
          Phase 1 foundation is ready. Next steps are domain models, orchestration, and API
          slices.
        </p>
      </header>
    </main>
  );
}
