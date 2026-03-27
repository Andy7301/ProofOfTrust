import type { RequestStatus } from "@proof/domain";
import { clsx } from "clsx";

const styles: Record<RequestStatus, string> = {
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  AI_VERIFIED: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  APPROVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  REJECTED: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  MANUAL_REVIEW: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  X402_PENDING: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  PAID: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  FAILED: "border-rose-400/30 bg-rose-400/10 text-rose-200"
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        styles[status]
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
