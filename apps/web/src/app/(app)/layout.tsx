import { AppHeader } from "@/components/shell/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <div className="relative z-10 mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-6 py-8">{children}</div>
    </>
  );
}
