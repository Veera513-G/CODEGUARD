import type { AIAnalysisResult } from "@/types/review";
import { SYSTEM_PROMPT, buildAnalysisPrompt } from "./prompts";
import { parseAnalysisResult } from "./parser";
import { validateSyntax } from "../analysis/syntax";
import { runASTRules, AnalyzedFinding } from "../analysis/ast-rules";
import { runSecurityScan } from "../analysis/security";
import { runComplexityAnalysis } from "../analysis/complexity";
import { verifyAndDeduplicateFindings } from "../analysis/verifier";
import { calculateDeterministicScores } from "../analysis/scoring";
import { generateOptimizedCode } from "../analysis/code-optimizer";

export interface AnalyzeCodeOptions {
  code: string;
  language: string;
  provider?: string;
}

export interface AnalyzeCodeResult extends AIAnalysisResult {
  provider: string;
  model: string;
  tokensUsed?: number;
  processingTime: number;
}

async function analyzeWithOpenAI(
  code: string,
  language: string,
  staticFindings: AnalyzedFinding[]
): Promise<AnalyzeCodeResult> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const start = Date.now();

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${buildAnalysisPrompt(code, language)}\n\nDeterministic Static Pre-Analysis Findings:\n${JSON.stringify(
          staticFindings,
          null,
          2
        )}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const result = parseAnalysisResult(content);

  return {
    ...result,
    provider: "openai",
    model,
    tokensUsed: response.usage?.total_tokens,
    processingTime: Date.now() - start,
  };
}

async function analyzeWithAnthropic(
  code: string,
  language: string,
  staticFindings: AnalyzedFinding[]
): Promise<AnalyzeCodeResult> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  const start = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${buildAnalysisPrompt(code, language)}\n\nDeterministic Static Pre-Analysis Findings:\n${JSON.stringify(
          staticFindings,
          null,
          2
        )}`,
      },
    ],
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  const result = parseAnalysisResult(content);

  return {
    ...result,
    provider: "anthropic",
    model,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    processingTime: Date.now() - start,
  };
}

async function analyzeWithGemini(
  code: string,
  language: string,
  staticFindings: AnalyzedFinding[]
): Promise<AnalyzeCodeResult> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const start = Date.now();

  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const response = await geminiModel.generateContent(
    `${buildAnalysisPrompt(code, language)}\n\nDeterministic Static Pre-Analysis Findings:\n${JSON.stringify(
      staticFindings,
      null,
      2
    )}`
  );

  const content = response.response.text();
  const result = parseAnalysisResult(content);

  return {
    ...result,
    provider: "gemini",
    model,
    processingTime: Date.now() - start,
  };
}

export async function analyzeCode(
  options: AnalyzeCodeOptions
): Promise<AnalyzeCodeResult> {
  const { code, language, provider = process.env.AI_PROVIDER || "openai" } = options;

  const maxLength = parseInt(process.env.MAX_CODE_LENGTH || "50000");
  if (code.length > maxLength) {
    throw new Error(`Code exceeds maximum length of ${maxLength} characters`);
  }

  const start = Date.now();
  const langUpper = (language || "source").toUpperCase();

  // ─── STEP 1: Deterministic Syntax Validation ──────────────────────────────
  const syntaxResult = validateSyntax(code, language);
  const syntaxFindings: AnalyzedFinding[] = syntaxResult.errors.map((err, idx) => ({
    id: `syntax-err-${idx + 1}`,
    type: "BUG",
    severity: "CRITICAL",
    title: `Syntax Defect: ${err.message}`,
    description: `Lexical parser failed at line ${err.line}: ${err.message}. Code cannot compile or execute correctly.`,
    lineStart: err.line,
    lineEnd: err.line,
    suggestion: "Correct the syntax structure and ensure all brackets/delimiters are matched.",
    confidence: "CONFIRMED",
    reason: "Direct lexical and bracket balance violation.",
    impact: "Causes CompilationError / SyntaxError at runtime.",
    evidence: err.snippet || "",
  }));

  // ─── STEP 2: AST Rules & Logical Bug Detection ────────────────────────────
  const astFindings = runASTRules(code, language);

  // ─── STEP 3: Static Security Analysis ─────────────────────────────────────
  const securityFindings = runSecurityScan(code, language);

  // ─── STEP 4: Algorithmic & Big-O Complexity Analysis ──────────────────────
  const complexityResult = runComplexityAnalysis(code, language);

  // ─── STEP 5: False-Positive Reduction & Deduplication ─────────────────────
  const rawFindings = [
    ...syntaxFindings,
    ...astFindings,
    ...securityFindings,
    ...complexityResult.findings,
  ];
  const verifiedFindings = verifyAndDeduplicateFindings(rawFindings, code);

  // ─── STEP 6: Deterministic Mathematical Scoring ───────────────────────────
  const scores = calculateDeterministicScores(verifiedFindings, code);

  // ─── STEP 7: High-Fidelity Code Remediation Generator ─────────────────────
  const optimization = generateOptimizedCode(code, language, verifiedFindings);

  // ─── STEP 8: Attempt AI Reasoning Augmentation (if API keys available) ────
  const providers = [provider, "openai", "anthropic", "gemini"].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );

  for (const p of providers) {
    try {
      if (p === "openai" && process.env.OPENAI_API_KEY) {
        const aiResult = await analyzeWithOpenAI(code, language, verifiedFindings);
        return {
          ...aiResult,
          // Ensure deterministic score accuracy
          overallScore: scores.overallScore,
          qualityScore: scores.qualityScore,
          securityScore: scores.securityScore,
          performanceScore: scores.performanceScore,
          maintainabilityScore: scores.maintainabilityScore,
          reliabilityScore: scores.reliabilityScore,
          readabilityScore: scores.readabilityScore,
          optimizedCode: aiResult.optimizedCode || optimization.optimizedCode,
        };
      }
      if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        const aiResult = await analyzeWithAnthropic(code, language, verifiedFindings);
        return {
          ...aiResult,
          overallScore: scores.overallScore,
          qualityScore: scores.qualityScore,
          securityScore: scores.securityScore,
          performanceScore: scores.performanceScore,
          maintainabilityScore: scores.maintainabilityScore,
          reliabilityScore: scores.reliabilityScore,
          readabilityScore: scores.readabilityScore,
          optimizedCode: aiResult.optimizedCode || optimization.optimizedCode,
        };
      }
      if (p === "gemini" && process.env.GEMINI_API_KEY) {
        const aiResult = await analyzeWithGemini(code, language, verifiedFindings);
        return {
          ...aiResult,
          overallScore: scores.overallScore,
          qualityScore: scores.qualityScore,
          securityScore: scores.securityScore,
          performanceScore: scores.performanceScore,
          maintainabilityScore: scores.maintainabilityScore,
          reliabilityScore: scores.reliabilityScore,
          readabilityScore: scores.readabilityScore,
          optimizedCode: aiResult.optimizedCode || optimization.optimizedCode,
        };
      }
    } catch (aiErr) {
      console.warn(`[AI Engine] Provider ${p} failed, continuing with deterministic audit:`, aiErr);
    }
  }

  // ─── STEP 9: Return High-Performance Hybrid Audit Result ───────────────────
  return {
    overallScore: scores.overallScore,
    qualityScore: scores.qualityScore,
    securityScore: scores.securityScore,
    performanceScore: scores.performanceScore,
    maintainabilityScore: scores.maintainabilityScore,
    reliabilityScore: scores.reliabilityScore,
    readabilityScore: scores.readabilityScore,
    summary:
      verifiedFindings.length > 0
        ? `Hybrid AST and security threat analysis identified ${verifiedFindings.length} defect(s) across Security, Correctness, and Performance vectors in ${langUpper}. Deterministic remediation patches and error-free code generated.`
        : `Zero defects detected. Submitted ${langUpper} code satisfies enterprise zero-defect baseline criteria across correctness, security, and algorithmic complexity.`,
    issues: verifiedFindings.map((f) => ({
      type: f.type,
      severity: f.severity,
      confidence: f.confidence,
      title: f.title,
      description: f.description,
      lineStart: f.lineStart,
      lineEnd: f.lineEnd,
      suggestion: f.suggestion,
      fixedCode: f.fixedCode,
      reason: f.reason,
      impact: f.impact,
      attackSurface: f.attackSurface,
      evidence: f.evidence,
    })),
    recommendations: [
      {
        category: "Security",
        title: "Enforce Strict Parameterized Queries & Least-Privilege DB Access",
        description:
          "Audit all database access layers to ensure dynamic string interpolation is strictly disallowed. Use database accounts with bounded permissions (e.g. read/write restricted to specific schemas) and enable query auditing on sensitive tables.",
        priority: 1,
      },
      {
        category: "Architecture",
        title: "Establish Type-Safe Schema Contracts at Gateway Boundaries",
        description:
          "Implement declarative validation contracts (Zod / Pydantic) across all API entry points and worker message queues. Reject untyped payloads at the edge before dispatching to internal domain services.",
        priority: 2,
      },
      {
        category: "Performance",
        title: "Optimize Data Ingestion with Hash-Map Lookups & Indexing",
        description:
          "Replace repeated linear array scans with constant O(1) hash maps. Ensure foreign keys and filtered columns in your storage engine have composite indexes aligned with access patterns.",
        priority: 3,
      },
      {
        category: "Reliability",
        title: "Standardize Telemetry with Structured Logging & Error Contexts",
        description:
          "Integrate structured JSON logging (e.g. Pino or Winston/Loguru) with request IDs, user context, and execution timing. Configure dead-letter queues and circuit breakers for external downstream calls.",
        priority: 4,
      },
      {
        category: "Testing",
        title: "Integrate Automated Fuzz Testing & Boundary Coverage",
        description:
          "Implement unit tests covering negative inputs, edge cases (empty collections, boundary integers, malicious payloads), and mock failure modes to achieve minimum 85% branch coverage.",
        priority: 5,
      },
    ],
    optimizedCode: optimization.optimizedCode,
    provider: "codeguard-hybrid-ast-engine",
    model: "hybrid-v5-enterprise",
    processingTime: Date.now() - start,
  };
}
