import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofOfTrust",
  description: "Agentic cross-chain expense concierge"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
