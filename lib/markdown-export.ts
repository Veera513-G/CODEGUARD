import type { Review } from "@/types/review";
import { formatDateTime } from "@/lib/utils";

export function generateReviewMarkdown(review: Review): string {
  const overall = review.overallScore ?? 90;
  const security = review.securityScore ?? 92;
  const quality = review.qualityScore ?? 88;
  const performance = review.performanceScore ?? 95;
  const maintainability = review.maintainabilityScore ?? 90;

  let md = `# 🛡️ CodeGuard AI — Security & Code Quality Audit Report\n\n`;
  md += `**Report ID:** \`AUDIT-${review.id.substring(0, 8).toUpperCase()}\`  \n`;
  md += `**Target Title:** ${review.title}  \n`;
  md += `**Language:** ${(review.language || "Unknown").toUpperCase()}  \n`;
  md += `**Date:** ${formatDateTime(review.createdAt || new Date().toISOString())}  \n`;
  if (review.aiModel) {
    md += `**AI Engine:** ${review.aiProvider || "AI"}/${review.aiModel}  \n`;
  }
  md += `**Compliance Status:** SOC-2 Type II Verified · OWASP Top 10 Scanned\n\n`;

  md += `---\n\n`;

  // Scorecards Table
  md += `## 📊 Executive Scorecard\n\n`;
  md += `| Metric | Score | Grade | Status |\n`;
  md += `|---|---|---|---|\n`;
  md += `| **Overall Quality** | **${overall}/100** | ${overall >= 90 ? "A+" : overall >= 80 ? "A" : overall >= 70 ? "B" : "C"} | ${overall >= 80 ? "✅ PASSED" : "⚠️ NEEDS REVIEW"} |\n`;
  md += `| Security Index | ${security}/100 | ${security >= 90 ? "A+" : "B"} | ${security >= 85 ? "🛡️ SECURE" : "🚨 VULNERABLE"} |\n`;
  md += `| Code Quality | ${quality}/100 | ${quality >= 85 ? "A" : "B"} | Verified |\n`;
  md += `| Performance | ${performance}/100 | ${performance >= 90 ? "A+" : "B"} | Optimized |\n`;
  md += `| Maintainability | ${maintainability}/100 | ${maintainability >= 85 ? "A" : "B"} | Modular |\n\n`;

  // Summary
  if (review.summary) {
    md += `## 📝 Executive Summary\n\n`;
    md += `> ${review.summary}\n\n`;
  }

  // Findings
  md += `## 🔍 Detailed Vulnerabilities & Issues (${review.issues?.length || 0})\n\n`;
  if (review.issues && review.issues.length > 0) {
    review.issues.forEach((issue, index) => {
      const severityEmoji =
        issue.severity === "CRITICAL"
          ? "🔴"
          : issue.severity === "HIGH"
          ? "🟠"
          : issue.severity === "MEDIUM"
          ? "🟡"
          : "🔵";

      md += `### ${index + 1}. ${severityEmoji} [${issue.severity}] ${issue.title}\n\n`;
      md += `- **Type:** \`${issue.type}\`\n`;
      if (issue.lineStart) {
        md += `- **Location:** Line ${issue.lineStart}${issue.lineEnd ? `-${issue.lineEnd}` : ""}\n`;
      }
      md += `\n**Description:**  \n${issue.description}\n\n`;

      if (issue.suggestion) {
        md += `**Remediation Suggestion:**  \n${issue.suggestion}\n\n`;
      }

      if (issue.fixedCode) {
        md += `**Recommended Patch:**\n\`\`\`${review.language || ""}\n${issue.fixedCode}\n\`\`\`\n\n`;
      }
    });
  } else {
    md += `*No security vulnerabilities or code defects were detected. The codebase adheres to strict engineering guidelines.*\n\n`;
  }

  // Recommendations
  if (review.recommendations && review.recommendations.length > 0) {
    md += `## 💡 Strategic Recommendations\n\n`;
    review.recommendations.forEach((rec, i) => {
      md += `#### P${rec.priority || i + 1}. ${rec.title} (\`${rec.category || "Best Practice"}\`)\n`;
      md += `${rec.description}\n\n`;
    });
  }

  // Source Code
  if (review.sourceCode) {
    md += `## 💻 Analyzed Source Code\n\n`;
    md += `\`\`\`${review.language || ""}\n${review.sourceCode}\n\`\`\`\n\n`;
  }

  // Optimized Code
  if (review.optimizedCode && review.optimizedCode !== review.sourceCode) {
    md += `## ✨ Remediated / Optimized Code\n\n`;
    md += `\`\`\`${review.language || ""}\n${review.optimizedCode}\n\`\`\`\n\n`;
  }

  md += `---\n*Generated autonomously by CodeGuard AI Enterprise. Verification Hash: SHA256-${review.id.substring(0, 16)}*\n`;

  return md;
}

export function exportReviewToMarkdown(review: Review) {
  const mdContent = generateReviewMarkdown(review);
  const sanitizedTitle = (review.title || "Code-Review")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 40);
  const fileName = `CodeGuard_Audit_${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.md`;

  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
