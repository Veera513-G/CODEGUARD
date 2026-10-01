import { z } from "zod";
import type { AIAnalysisResult } from "@/types/review";

const issueSchema = z.object({
  type: z.enum(["BUG", "SECURITY", "PERFORMANCE", "QUALITY", "BEST_PRACTICE"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
  title: z.string(),
  description: z.string(),
  lineStart: z.number().nullable().optional(),
  lineEnd: z.number().nullable().optional(),
  suggestion: z.string().nullable().optional(),
  fixedCode: z.string().nullable().optional(),
});

const recommendationSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.number().int().min(1).max(5),
});

const analysisResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  qualityScore: z.number().int().min(0).max(100),
  securityScore: z.number().int().min(0).max(100),
  performanceScore: z.number().int().min(0).max(100),
  maintainabilityScore: z.number().int().min(0).max(100),
  summary: z.string(),
  issues: z.array(issueSchema),
  recommendations: z.array(recommendationSchema),
  optimizedCode: z.string(),
});

export function parseAnalysisResult(rawContent: string): AIAnalysisResult {
  // Try to extract JSON from the content
  let jsonStr = rawContent.trim();

  // Remove markdown code blocks if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "");

  // Try to find JSON object boundaries
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const validated = analysisResultSchema.parse(parsed);
    return validated as AIAnalysisResult;
  } catch (parseError) {
    console.error("[AI Parser] Failed to parse response:", parseError);
    // Return a fallback result
    return {
      overallScore: 50,
      qualityScore: 50,
      securityScore: 50,
      performanceScore: 50,
      maintainabilityScore: 50,
      summary: "Analysis completed with partial results. Manual review recommended.",
      issues: [
        {
          type: "QUALITY",
          severity: "INFO",
          title: "Analysis Incomplete",
          description: "The AI analysis could not be fully parsed. Please try again.",
          suggestion: "Retry the analysis with a cleaner code snippet.",
        },
      ],
      recommendations: [],
      optimizedCode: "",
    };
  }
}
