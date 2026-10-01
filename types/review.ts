export type IssueType = "BUG" | "SECURITY" | "PERFORMANCE" | "QUALITY" | "BEST_PRACTICE";
export type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type IssueConfidence = "CONFIRMED" | "LIKELY" | "POTENTIAL";
export type ReviewStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type SourceType = "PASTE" | "FILE_UPLOAD" | "ZIP_UPLOAD" | "GITHUB_IMPORT";

export interface ReviewIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  confidence?: IssueConfidence;
  title: string;
  description: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  suggestion?: string;
  fixedCode?: string;
  reason?: string;
  impact?: string;
  attackSurface?: string;
  evidence?: string;
}

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: number;
}

export interface Review {
  id: string;
  title: string;
  language: string;
  sourceType: SourceType;
  sourceCode: string;
  fileName?: string;
  status: ReviewStatus;
  overallScore?: number;
  qualityScore?: number;
  securityScore?: number;
  performanceScore?: number;
  maintainabilityScore?: number;
  reliabilityScore?: number;
  readabilityScore?: number;
  optimizedCode?: string;
  summary?: string;
  aiProvider?: string;
  aiModel?: string;
  processingTime?: number;
  tokensUsed?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  issues: ReviewIssue[];
  recommendations: Recommendation[];
}

export interface AIAnalysisResult {
  overallScore: number;
  qualityScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  reliabilityScore?: number;
  readabilityScore?: number;
  issues: Array<{
    type: IssueType;
    severity: IssueSeverity;
    confidence?: IssueConfidence;
    title: string;
    description: string;
    lineStart?: number;
    lineEnd?: number;
    suggestion?: string;
    fixedCode?: string;
    reason?: string;
    impact?: string;
    attackSurface?: string;
    evidence?: string;
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: number;
  }>;
  optimizedCode: string;
  summary: string;
}

export const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript", ext: ".js" },
  { value: "typescript", label: "TypeScript", ext: ".ts" },
  { value: "python", label: "Python", ext: ".py" },
  { value: "java", label: "Java", ext: ".java" },
  { value: "c", label: "C", ext: ".c" },
  { value: "cpp", label: "C++", ext: ".cpp" },
  { value: "csharp", label: "C#", ext: ".cs" },
  { value: "php", label: "PHP", ext: ".php" },
  { value: "go", label: "Go", ext: ".go" },
  { value: "rust", label: "Rust", ext: ".rs" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["value"];
