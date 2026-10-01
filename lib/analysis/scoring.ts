import type { AnalyzedFinding } from "./ast-rules";

export interface DeterministicScores {
  overallScore: number;
  qualityScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  reliabilityScore: number;
  readabilityScore: number;
}

export function calculateDeterministicScores(
  findings: AnalyzedFinding[],
  code: string
): DeterministicScores {
  let securityDeductions = 0;
  let bugDeductions = 0;
  let performanceDeductions = 0;
  let qualityDeductions = 0;

  for (const finding of findings) {
    const weight =
      finding.severity === "CRITICAL"
        ? 35
        : finding.severity === "HIGH"
        ? 20
        : finding.severity === "MEDIUM"
        ? 10
        : 5;

    // Confidence multiplier
    const confMultiplier =
      finding.confidence === "CONFIRMED" ? 1.0 : finding.confidence === "LIKELY" ? 0.8 : 0.5;

    const penalty = weight * confMultiplier;

    if (finding.type === "SECURITY") {
      securityDeductions += penalty;
    } else if (finding.type === "BUG") {
      bugDeductions += penalty;
    } else if (finding.type === "PERFORMANCE") {
      performanceDeductions += penalty;
    } else {
      qualityDeductions += penalty;
    }
  }

  const securityScore = Math.max(10, Math.round(100 - securityDeductions));
  const qualityScore = Math.max(20, Math.round(100 - (bugDeductions + qualityDeductions * 0.7)));
  const performanceScore = Math.max(25, Math.round(100 - performanceDeductions));
  const maintainabilityScore = Math.max(30, Math.round(100 - (qualityDeductions + bugDeductions * 0.4)));
  const reliabilityScore = Math.max(15, Math.round(100 - (bugDeductions * 1.2 + securityDeductions * 0.5)));
  const readabilityScore = Math.max(40, Math.round(100 - qualityDeductions * 0.6));

  // Weighted overall calculation
  const overallScore = Math.round(
    securityScore * 0.35 +
      qualityScore * 0.25 +
      performanceScore * 0.2 +
      reliabilityScore * 0.2
  );

  return {
    overallScore: Math.min(100, Math.max(20, overallScore)),
    qualityScore: Math.min(100, qualityScore),
    securityScore: Math.min(100, securityScore),
    performanceScore: Math.min(100, performanceScore),
    maintainabilityScore: Math.min(100, maintainabilityScore),
    reliabilityScore: Math.min(100, reliabilityScore),
    readabilityScore: Math.min(100, readabilityScore),
  };
}
