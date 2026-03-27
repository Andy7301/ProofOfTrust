type TimelineEvent = {
  title: string;
  subtitle: string;
  meta: string;
  state: "complete" | "active" | "pending";
};

type TimelineProps = {
  events: readonly TimelineEvent[];
};

const dotClassByState: Record<TimelineEvent["state"], string> = {
  complete: "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.7)]",
  active: "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,.8)]",
  pending: "bg-slate-500"
};

export function Timeline({ events }: TimelineProps) {
  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-content-muted">
        Request timeline
      </h3>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={`${event.title}-${idx}`} className="flex gap-3">
            <div className="flex w-6 flex-col items-center">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClassByState[event.state]}`} />
              {idx < events.length - 1 ? <span className="mt-1 h-full w-px bg-white/15" /> : null}
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-content-primary">{event.title}</p>
              <p className="text-sm text-content-muted">{event.subtitle}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-content-faint">{event.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
