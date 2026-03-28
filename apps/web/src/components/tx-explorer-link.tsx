"use client";

type TxExplorerLinkProps = {
  label: string;
  url: string | null;
  mono?: boolean;
};

export function TxExplorerLink({ label, url, mono }: TxExplorerLinkProps) {
  if (!url) {
    return (
      <span className={mono ? "font-mono text-xs text-content-muted" : "text-sm text-content-muted"}>
        {label}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        mono
          ? "font-mono text-xs text-solana underline decoration-solana/40 hover:decoration-solana"
          : "text-sm text-solana underline decoration-solana/40 hover:decoration-solana"
      }
    >
      {label}
    </a>
  );
}
