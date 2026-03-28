import { isMockFilecoinAudit } from "./env";

/**
 * Full Synapse warm-storage upload is heavy for a hackathon route.
 * When FILECOIN_AUDIT_MODE is real, we still only record RPC reachability unless extended later.
 */
export async function optionalAuditPieceCid(input: {
  requestId: string;
}): Promise<string | undefined> {
  if (isMockFilecoinAudit()) return undefined;
  void input;
  return `audit:pending:${input.requestId}`;
}
