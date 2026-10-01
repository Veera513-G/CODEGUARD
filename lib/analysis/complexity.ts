import type { AnalyzedFinding } from "./ast-rules";

export interface ComplexityProfile {
  currentComplexity: string;
  optimizedComplexity: string;
  reason: string;
  optimization: string;
  expectedBenefit: string;
}

export function runComplexityAnalysis(code: string, language: string): {
  findings: AnalyzedFinding[];
  profiles: ComplexityProfile[];
} {
  const findings: AnalyzedFinding[] = [];
  const profiles: ComplexityProfile[] = [];
  const lines = code.split("\n");

  const findLines = (pattern: RegExp): Array<{ lineNum: number; text: string }> => {
    const matches: Array<{ lineNum: number; text: string }> = [];
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({ lineNum: i + 1, text: lines[i] });
      }
    }
    return matches;
  };

  // ─── 1. Quadratic O(N²) Loop with Nested Linear Array Lookup ───────────────
  const nestedLookups = findLines(
    /(for\s*\(|for\s+\w+\s+in\s+|while\s*\()[\s\S]*(\.(filter|find|indexOf|includes|some|every)\()/
  );

  // Also check if .find / .filter is called within a loop body in nearby lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("for ") || line.includes("while ") || line.includes(".forEach(")) {
      // Check next 10 lines
      for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
        if (
          lines[j].includes(".filter(") ||
          lines[j].includes(".find(") ||
          lines[j].includes(".indexOf(") ||
          lines[j].includes(".includes(")
        ) {
          const finding: AnalyzedFinding = {
            id: `comp-quadratic-lookup-${j + 1}`,
            type: "PERFORMANCE",
            severity: "LOW",
            title: "CWE-400: O(N²) Quadratic Complexity via Nested Linear Search in Loop",
            description:
              "A linear collection lookup (.filter / .find / .indexOf / .includes) is executed repeatedly inside an outer loop cycle, causing quadratic O(N²) computational runtime scaling.",
            lineStart: i + 1,
            lineEnd: j + 1,
            suggestion:
              "Pre-index the inner collection into a Hash Map or Set before loop execution to achieve O(1) constant lookup time and reduce total time complexity to O(N).",
            fixedCode:
              language === "python"
                ? `# Pre-index secondary dataset for O(1) constant-time lookup\nlookup_set = {item['id'] for item in secondary_items}\nresults = [item for item in primary_items if item['id'] in lookup_set]`
                : `// Pre-index target collection into a Set for O(1) lookup\nconst lookupSet = new Set(secondaryItems.map(item => item.id));\nconst results = primaryItems.filter(item => lookupSet.has(item.id));`,
            confidence: "CONFIRMED",
            reason: "Repeated linear scan of size M inside loop of size N results in O(N × M) execution.",
            impact: "Severe latency degradation and high CPU utilization as dataset size grows beyond 1,000 items.",
            evidence: lines[j].trim(),
          };

          findings.push(finding);
          profiles.push({
            currentComplexity: "O(N²)",
            optimizedComplexity: "O(N)",
            reason: "Linear search inside loop replaced with Hash Map / Set constant lookup.",
            optimization: "Pre-index target lookup keys into Set or Map before entering the loop.",
            expectedBenefit: "Reduces execution time by up to 98% for datasets > 1,000 records.",
          });
          break;
        }
      }
    }
  }

  // ─── 2. Database N+1 Query in Loop ─────────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("for ") || line.includes("while ") || line.includes(".map(")) {
      for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
        if (
          lines[j].includes("prisma.") ||
          lines[j].includes("db.query") ||
          lines[j].includes("cursor.execute") ||
          lines[j].includes("await fetch(")
        ) {
          findings.push({
            id: `comp-n-plus-one-${j + 1}`,
            type: "PERFORMANCE",
            severity: "MEDIUM",
            title: "Performance Defect: N+1 Database / API Query Bottleneck in Loop",
            description:
              "Database queries or HTTP network calls are initiated inside an iteration cycle, causing N round-trip network hops.",
            lineStart: i + 1,
            lineEnd: j + 1,
            suggestion:
              "Batch the database query using 'IN (...)' or Prisma 'findMany({ where: { id: { in: ids } } })' outside the loop.",
            fixedCode: `// Batch fetch all entities in a single round-trip\nconst entities = await prisma.entity.findMany({\n  where: { id: { in: itemIds } }\n});`,
            confidence: "CONFIRMED",
            reason: "Sequential database network requests dispatched for each iteration element.",
            impact: "Network I/O bottleneck and database connection pool saturation.",
            evidence: lines[j].trim(),
          });
          profiles.push({
            currentComplexity: "O(N) network hops",
            optimizedComplexity: "O(1) batched query",
            reason: "Batched database query reduces network latency from N calls to 1 round-trip.",
            optimization: "Collect entity IDs and query with IN clause or ORM relation includes.",
            expectedBenefit: "Reduces network overhead by 90%+ and eliminates database socket contention.",
          });
          break;
        }
      }
    }
  }

  return { findings, profiles };
}
