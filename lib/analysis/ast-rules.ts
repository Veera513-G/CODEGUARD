import type { IssueType, IssueSeverity } from "@/types/review";

export interface AnalyzedFinding {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  suggestion: string;
  fixedCode?: string;
  confidence: "CONFIRMED" | "LIKELY" | "POTENTIAL";
  reason: string;
  impact: string;
  attackSurface?: string;
  evidence?: string;
}

export function runASTRules(code: string, language: string): AnalyzedFinding[] {
  const findings: AnalyzedFinding[] = [];
  const lines = code.split("\n");
  const lang = (language || "").toLowerCase();

  // Helper to find lines matching a regex pattern
  const findLines = (pattern: RegExp): Array<{ lineNum: number; text: string }> => {
    const matches: Array<{ lineNum: number; text: string }> = [];
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({ lineNum: i + 1, text: lines[i] });
      }
    }
    return matches;
  };

  // ─── 1. Incorrect Assignment in Conditional Statement ──────────────────────
  // Detects `if (x = 5)` instead of `if (x === 5)`
  const assignmentInIf = findLines(/if\s*\([^=!<>\n]+=[^=!<>\n]+\)/);
  for (const match of assignmentInIf) {
    if (!match.text.includes("==") && !match.text.includes("===") && !match.text.includes("!=")) {
      findings.push({
        id: `rule-assign-in-cond-${match.lineNum}`,
        type: "BUG",
        severity: "CRITICAL",
        title: "Defect: Assignment Operator '=' in Conditional Expression",
        description:
          "Single assignment operator '=' detected inside an 'if' condition. This reassigns the variable instead of performing equality comparison, which always evaluates truthy/falsy depending on the assigned value.",
        lineStart: match.lineNum,
        lineEnd: match.lineNum,
        suggestion: "Replace assignment '=' with equality comparison '===' (or '==' in Python/C++).",
        fixedCode: match.text.replace(/([^=!<>\n]+)=([^=!<>\n]+)/, "$1===$2"),
        confidence: "CONFIRMED",
        reason: "Conditional expression uses assignment '=' rather than relational equality.",
        impact: "Causes unintended branch execution and overwrites variable state.",
        evidence: match.text.trim(),
      });
    }
  }

  // ─── 2. Off-by-One Array Bounds Error ──────────────────────────────────────
  // Detects `for (let i = 0; i <= array.length; i++)`
  const offByOneLoops = findLines(/for\s*\([^;]+;\s*\w+\s*<=\s*[\w.]+\.length\s*;\s*\w+\+\+\s*\)/);
  for (const match of offByOneLoops) {
    findings.push({
      id: `rule-off-by-one-${match.lineNum}`,
      type: "BUG",
      severity: "HIGH",
      title: "CWE-193: Off-by-One Array Index Out-of-Bounds Iteration",
      description:
        "Loop boundary condition uses '<=' with array.length instead of '<'. In 0-indexed arrays, accessing array[length] results in 'undefined' or throws an IndexOutOfBoundsException.",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion: "Change '<=' to '<' in the loop continuation condition.",
      fixedCode: match.text.replace(/<=\s*([\w.]+\.length)/, "< $1"),
      confidence: "CONFIRMED",
      reason: "Iterating up to index equal to array.length overflows 0-indexed array bounds.",
      impact: "Triggers undefined property dereferencing or runtime array bounds exceptions.",
      evidence: match.text.trim(),
    });
  }

  // ─── 3. Unreachable Code After Return / Throw ──────────────────────────────
  for (let i = 0; i < lines.length - 1; i++) {
    const trimmed = lines[i].trim();
    const nextTrimmed = lines[i + 1].trim();

    if (
      (trimmed.startsWith("return ") || trimmed === "return;" || trimmed.startsWith("throw ")) &&
      !trimmed.endsWith(":") &&
      nextTrimmed.length > 0 &&
      !nextTrimmed.startsWith("}") &&
      !nextTrimmed.startsWith("case ") &&
      !nextTrimmed.startsWith("default:") &&
      !nextTrimmed.startsWith("//") &&
      !nextTrimmed.startsWith("/*") &&
      !nextTrimmed.startsWith("catch") &&
      !nextTrimmed.startsWith("finally")
    ) {
      // Check if indentation matches (same block level)
      const currentIndent = lines[i].search(/\S/);
      const nextIndent = lines[i + 1].search(/\S/);
      if (currentIndent === nextIndent && currentIndent > 0) {
        findings.push({
          id: `rule-unreachable-${i + 2}`,
          type: "QUALITY",
          severity: "MEDIUM",
          title: "CWE-561: Dead / Unreachable Code Block",
          description:
            "Statements located immediately after an unconditional 'return' or 'throw' in the same block will never be executed.",
          lineStart: i + 2,
          lineEnd: i + 2,
          suggestion: "Remove dead statements or move them before the terminal return/throw statement.",
          confidence: "CONFIRMED",
          reason: "Control flow terminates at previous statement; subsequent lines in scope are unreachable.",
          impact: "Unexecuted logic and dead code clutter the codebase.",
          evidence: lines[i + 1].trim(),
        });
        break;
      }
    }
  }

  // ─── 4. Missing Await on Async / Network Calls ─────────────────────────────
  const floatingPromises = findLines(/(^|\s+)(fetch|axios\.\w+|prisma\.\w+\.\w+|bcrypt\.\w+)\(/);
  for (const match of floatingPromises) {
    if (
      !match.text.includes("await ") &&
      !match.text.includes(".then(") &&
      !match.text.includes("return ") &&
      !match.text.includes("const ") &&
      !match.text.includes("let ")
    ) {
      findings.push({
        id: `rule-floating-promise-${match.lineNum}`,
        type: "BUG",
        severity: "HIGH",
        title: "Unhandled Floating Promise / Missing 'await' Operator",
        description:
          "Asynchronous I/O or network promise is invoked without 'await' or promise chaining. The operation executes unmonitored in the background; unhandled rejections will not be caught.",
        lineStart: match.lineNum,
        lineEnd: match.lineNum,
        suggestion: "Prefix the asynchronous invocation with 'await' or attach a '.catch()' error handler.",
        fixedCode: match.text.replace(/(\b(?:fetch|axios\.\w+|prisma\.\w+\.\w+)\()/, "await $1"),
        confidence: "LIKELY",
        reason: "Promise-returning function called without synchronization or rejection handler.",
        impact: "Silent failures, unhandled promise rejections, race conditions.",
        evidence: match.text.trim(),
      });
    }
  }

  // ─── 5. Incorrect Type Assumptions ─────────────────────────────────────────
  // Detects `typeof x === 'array'` (typeof in JS returns 'object' for arrays)
  const typeofArray = findLines(/typeof\s+[\w.]+\s*===?\s*['"]array['"]/);
  for (const match of typeofArray) {
    findings.push({
      id: `rule-typeof-array-${match.lineNum}`,
      type: "BUG",
      severity: "CRITICAL",
      title: "Defect: Invalid Type Check 'typeof x === \"array\"'",
      description:
        "In JavaScript/TypeScript, 'typeof' for arrays evaluates to 'object', never 'array'. This condition will always evaluate to false.",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion: "Use 'Array.isArray(variable)' instead of 'typeof variable === \"array\"'.",
      fixedCode: match.text.replace(/typeof\s+([\w.]+)\s*===?\s*['"]array['"]/, "Array.isArray($1)"),
      confidence: "CONFIRMED",
      reason: "JavaScript type system specifies typeof [] === 'object'.",
      impact: "Conditional branch will never execute, breaking runtime logic.",
      evidence: match.text.trim(),
    });
  }

  // ─── 6. NaN Comparison Bug ─────────────────────────────────────────────────
  // Detects `x === NaN`
  const nanCompare = findLines(/===?\s*NaN|NaN\s*===?/);
  for (const match of nanCompare) {
    findings.push({
      id: `rule-nan-compare-${match.lineNum}`,
      type: "BUG",
      severity: "HIGH",
      title: "Defect: Direct Comparison with NaN (NaN === NaN is always false)",
      description:
        "IEEE 754 floating point standard defines NaN as not equal to anything, including NaN itself (NaN === NaN evaluates to false).",
      lineStart: match.lineNum,
      lineEnd: match.lineNum,
      suggestion: "Use Number.isNaN(value) instead of direct equality comparison with NaN.",
      confidence: "CONFIRMED",
      reason: "NaN comparisons always evaluate to false in accordance with IEEE 754 standard.",
      impact: "NaN checks always fail silently.",
      evidence: match.text.trim(),
    });
  }

  // ─── 7. Infinite Loops without Termination Condition ───────────────────────
  const infiniteWhile = findLines(/while\s*\(\s*(true|1)\s*\)/);
  for (const match of infiniteWhile) {
    // Check if loop body has break or return
    const followingCode = code.slice(code.indexOf(match.text));
    if (!followingCode.includes("break") && !followingCode.includes("return")) {
      findings.push({
        id: `rule-infinite-loop-${match.lineNum}`,
        type: "BUG",
        severity: "CRITICAL",
        title: "CWE-835: Infinite Loop without Exit Condition",
        description:
          "Loop has a permanent true condition and lacks a visible 'break' or 'return' statement, resulting in process hang and CPU exhaustion.",
        lineStart: match.lineNum,
        lineEnd: match.lineNum,
        suggestion: "Ensure an explicit break condition or terminating exit counter is implemented inside the loop.",
        confidence: "CONFIRMED",
        reason: "Infinite loop condition without break/return leads to thread starvation.",
        impact: "Denial of service via 100% CPU thread starvation.",
        evidence: match.text.trim(),
      });
    }
  }

  return findings;
}
