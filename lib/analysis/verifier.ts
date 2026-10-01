import type { AnalyzedFinding } from "./ast-rules";

export function verifyAndDeduplicateFindings(
  findings: AnalyzedFinding[],
  code: string
): AnalyzedFinding[] {
  const verified: AnalyzedFinding[] = [];
  const seenKeys = new Set<string>();

  for (const finding of findings) {
    // Deduplication Key: line number + type
    const key = `${finding.lineStart}:${finding.type}:${finding.title.slice(0, 20)}`;
    if (seenKeys.has(key)) continue;

    // ─── Verification Rule 1: Filter false positives in try/catch ─────────────
    if (finding.id.includes("unhandled-error")) {
      if (code.includes("try {") && code.includes("catch")) {
        // If code already has defensive error handling around this section, skip
        continue;
      }
    }

    // ─── Verification Rule 2: Check for Existing Parameterization ────────────
    if (finding.type === "SECURITY" && finding.title.includes("SQL Injection")) {
      const lineText = finding.evidence || "";
      if (
        lineText.includes("?") ||
        lineText.includes("$1") ||
        lineText.includes(":id") ||
        lineText.includes("prisma.")
      ) {
        // Already parameterized or using ORM
        continue;
      }
    }

    // ─── Verification Rule 3: Check for Existing Validation Guards ────────────
    if (finding.title.includes("Input Schema Validation")) {
      if (
        code.includes("zod") ||
        code.includes("pydantic") ||
        code.includes("isinstance") ||
        code.includes("validator") ||
        code.includes("typeof ")
      ) {
        finding.confidence = "POTENTIAL";
      }
    }

    seenKeys.add(key);
    verified.push(finding);
  }

  return verified;
}
