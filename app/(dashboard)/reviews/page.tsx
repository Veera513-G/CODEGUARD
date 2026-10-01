"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Code2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, timeAgo, scoreToColor } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { SUPPORTED_LANGUAGES } from "@/types/review";

interface ReviewItem {
  id: string;
  title: string;
  language: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  _count: { issues: number };
}

const statusIcon = (status: string) => {
  if (status === "COMPLETED") return <CheckCircle2 size={15} className="text-emerald-400" />;
  if (status === "FAILED") return <XCircle size={15} className="text-red-400" />;
  if (status === "PROCESSING") return <Loader2 size={15} className="text-blue-400 animate-spin" />;
  return <Clock size={15} className="text-slate-500" />;
};

export default function ReviewsPage() {
  const { tokens } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          ...(statusFilter && { status: statusFilter }),
          ...(langFilter && { language: langFilter }),
        });
        const res = await fetch(`/api/reviews?${params}`, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.data.items);
          setTotal(data.data.total);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [page, pageSize, statusFilter, langFilter, tokens]);

  const filtered = search
    ? reviews.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : reviews;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Code Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">{total} reviews total</p>
        </div>
        <Link
          href="/reviews/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Review
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>

        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
        >
          <option value="">All Languages</option>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Language
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Issues
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Code2 size={32} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-slate-500">No reviews found</p>
                    <Link href="/reviews/new" className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-block">
                      Create your first review →
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((review, i) => (
                  <motion.tr
                    key={review.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      {statusIcon(review.status)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/reviews/${review.id}`}
                        className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors"
                      >
                        {review.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="capitalize text-slate-400 text-sm">{review.language}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-400 text-sm">{review._count.issues}</span>
                    </td>
                    <td className="px-5 py-4">
                      {review.overallScore !== null ? (
                        <span className={cn("font-semibold text-sm", scoreToColor(review.overallScore))}>
                          {review.overallScore}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-500 text-sm">{timeAgo(review.createdAt)}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/60">
            <span className="text-slate-400 text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
