"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Code2,
  Upload,
  Archive,
  GitBranch,
  Play,
  Loader2,
  X,
  Sparkles,
  Zap,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES } from "@/types/review";
import { useAuthStore } from "@/stores/auth-store";

const TABS = [
  { id: "paste", label: "Paste Code", icon: Code2 },
  { id: "file", label: "Upload File", icon: Upload },
  { id: "zip", label: "Upload ZIP", icon: Archive },
  { id: "github", label: "GitHub", icon: GitBranch },
];

function detectLanguage(codeSnippet: string): string | null {
  if (!codeSnippet || codeSnippet.trim().length < 10) return null;
  const s = codeSnippet.trim();

  // Python
  if (
    /^\s*(def\s+\w+\s*\(|import\s+[\w.]+|from\s+[\w.]+\s+import|if\s+__name__\s*==\s*['"]__main__['"]|class\s+\w+(\(.*\))?:|print\s*\(|elif\s+|lambda\s+\w+:)/m.test(
      s
    )
  )
    return "python";

  // Rust
  if (/^\s*(fn\s+\w+\s*\(|use\s+std::|let\s+mut\s+\w+|pub\s+fn\s+\w+|impl\s+\w+)/m.test(s))
    return "rust";

  // Go
  if (/^\s*(package\s+\w+|func\s+(\(\w+\s+\*?\w+\)\s+)?\w+\s*\(|import\s+\(\s*["'])/m.test(s))
    return "go";

  // Java
  if (
    /^\s*(public\s+class\s+\w+|public\s+static\s+void\s+main|System\.out\.println|import\s+java\.|@Override)/m.test(
      s
    )
  )
    return "java";

  // C#
  if (
    /^\s*(using\s+System|namespace\s+\w+|public\s+void\s+\w+|Console\.WriteLine|public\s+async\s+Task)/m.test(
      s
    )
  )
    return "csharp";

  // C++
  if (
    /^\s*(#include\s*<iostream>|std::cout|using\s+namespace\s+std|template\s*<typename|#include\s*<vector>)/m.test(
      s
    )
  )
    return "cpp";

  // C
  if (/^\s*(#include\s*<stdio\.h>|int\s+main\s*\(\s*(void|int\s+argc)?|printf\s*\()/m.test(s))
    return "c";

  // PHP
  if (/^\s*(<\?php|\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*\s*=|echo\s+['"])/m.test(s))
    return "php";

  // TypeScript / JavaScript
  if (
    /^\s*(import\s+[\w\s{},*]+\s+from\s+['"]|export\s+(default\s+)?(function|class|const|interface|type)|const\s+\w+\s*:\s*\w+|interface\s+\w+\s*\{|type\s+\w+\s*=)/m.test(
      s
    ) ||
    /:\s*(string|number|boolean|any|void)|interface\s+\w+|type\s+\w+\s*=/m.test(s)
  ) {
    if (/(:\s*(string|number|boolean|any|void)|interface\s+\w+|type\s+\w+\s*=|<[A-Z]\w*>)/m.test(s)) {
      return "typescript";
    }
    return "javascript";
  }

  return null;
}

export default function NewReviewPage() {
  const router = useRouter();
  const { tokens } = useAuthStore();
  const [tab, setTab] = useState("paste");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [autoDetected, setAutoDetected] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-detect language whenever code changes
  useEffect(() => {
    if (code) {
      const detected = detectLanguage(code);
      if (detected) {
        setLanguage(detected);
        setAutoDetected(detected);
      } else {
        setAutoDetected(null);
      }
    } else {
      setAutoDetected(null);
    }
  }, [code]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);

    // Auto-detect language from extension
    const ext = f.name.split(".").pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      php: "php",
      go: "go",
      rs: "rust",
    };
    if (ext && langMap[ext]) {
      setLanguage(langMap[ext]);
      setAutoDetected(langMap[ext]);
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      if (!title) setTitle(f.name);
    };
    reader.readAsText(f);
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/*": [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".c", ".cpp", ".cs", ".php", ".go", ".rs"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleSubmit() {
    if (!title.trim()) return toast.error("Please enter a review title");
    if (!code.trim()) return toast.error("Please provide code to review");
    if (code.length < 10) return toast.error("Code is too short to analyze");

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          title,
          language,
          sourceType:
            tab === "paste"
              ? "PASTE"
              : tab === "file"
              ? "FILE_UPLOAD"
              : tab === "zip"
              ? "ZIP_UPLOAD"
              : "GITHUB_IMPORT",
          sourceCode: code,
          fileName: file?.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }

      toast.success("Review completed!");
      router.push(`/reviews/${data.data.id}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-cyan-400" />
          <span>Multi-Language AI Code Scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">New Code Review</h1>
        <p className="text-slate-400 text-sm mt-1">
          Paste your code or upload a file — language will be auto-detected automatically.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/[0.08] w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Review Title
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. User Authentication & Token Refresh Handler"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm transition-colors"
            />
          </div>

          {/* Code input */}
          {tab === "paste" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Source Code
                </label>
                {autoDetected && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                    <Zap size={12} />
                    <span>Auto-detected: {autoDetected.toUpperCase()}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  id="code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Paste your code here (Python, JavaScript, TypeScript, Java, C++, Go, Rust, PHP, etc.)..."
                  rows={19}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/[0.08] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 text-sm font-code resize-none transition-colors leading-relaxed"
                />
                {code && (
                  <button
                    onClick={() => setCode("")}
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    title="Clear editor"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{code.length.toLocaleString()} characters · {code.split("\n").length} lines</span>
                <span>Language: <span className="text-slate-300 font-semibold uppercase">{language}</span></span>
              </div>
            </div>
          )}

          {(tab === "file" || tab === "zip") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {tab === "zip" ? "ZIP Archive" : "Source File"}
              </label>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-900/30"
                )}
              >
                <input {...getInputProps()} />
                <Upload
                  size={32}
                  className={cn(
                    "mx-auto mb-4",
                    isDragActive ? "text-blue-400" : "text-slate-600"
                  )}
                />
                {file ? (
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-300 font-medium mb-1">
                      {isDragActive ? "Drop the file here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {tab === "zip" ? "ZIP archives up to 10MB" : ".js .ts .py .java .c .cpp .cs .php .go .rs"}
                    </p>
                  </div>
                )}
              </div>

              {code && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
                  <span>✓ File loaded ({code.length.toLocaleString()} characters)</span>
                  <span className="font-semibold uppercase">Detected: {language}</span>
                </div>
              )}
            </div>
          )}

          {tab === "github" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/organization/repository"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/[0.08] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 text-sm transition-colors"
                />
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 space-y-1">
                <p className="font-semibold text-white">GitHub Enterprise Integration</p>
                <p className="text-slate-400 text-xs">
                  Connect your GitHub Organization in Settings to review PRs and repositories automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar options */}
        <div className="space-y-4">
          {/* Language Selector with Auto-detect Indicator */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Language
              </label>
              {autoDetected && (
                <span className="text-[10px] text-emerald-400 font-bold uppercase">
                  Auto-detected
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => {
                    setLanguage(lang.value);
                    setAutoDetected(null);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                    language === lang.value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Matrix */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Audit Coverage</h3>
            {[
              { emoji: "🔒", label: "Zero-Day & Injection Scanner" },
              { emoji: "⚡", label: "Algorithm Performance" },
              { emoji: "🐛", label: "AST Bug Detection" },
              { emoji: "✨", label: "Clean Code & Refactoring" },
              { emoji: "💡", label: "Teach Me Mode & Explanations" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-xs text-slate-300">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Submit */}
          <motion.button
            id="submit-review"
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 px-6 rounded-xl gradient-primary text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Running AI Security Audit...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Start AI Audit Review</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
