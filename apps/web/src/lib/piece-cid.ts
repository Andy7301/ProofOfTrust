/** Middle-truncate long Piece CIDs for UI rows. */
export function displayPieceCid(cid: string, head = 16, tail = 10): string {
  const t = cid.trim();
  if (t.length <= head + tail + 1) return t;
  return `${t.slice(0, head)}…${t.slice(-tail)}`;
}
