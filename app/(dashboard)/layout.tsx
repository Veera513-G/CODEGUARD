import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Sidebar />
      <div className="ml-[var(--sidebar-width)]">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
