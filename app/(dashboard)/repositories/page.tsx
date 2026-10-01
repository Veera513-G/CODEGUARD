import type { Metadata } from "next";

export const metadata: Metadata = { title: "Repositories" };

export default function RepositoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Repositories</h1>
        <p className="text-slate-400 text-sm mt-1">Connect and scan your GitHub repositories</p>
      </div>
      <div className="p-12 rounded-2xl border border-dashed border-slate-700 text-center">
        <p className="text-slate-400">GitHub integration coming in Phase 2</p>
        <p className="text-slate-600 text-sm mt-1">Connect your GitHub account to scan repositories</p>
      </div>
    </div>
  );
}
