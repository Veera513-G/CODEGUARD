import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeCode } from "@/lib/ai/engine";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(props.params);
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing review ID" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const customCode = body.code;
    const customProvider = body.provider;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { issues: true, recommendations: true },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    const codeToAnalyze = customCode || review.sourceCode;
    const analysis = await analyzeCode({
      code: codeToAnalyze,
      language: review.language || "javascript",
      provider: customProvider,
    });

    // Delete previous issues & recommendations to replace with comprehensive findings
    await prisma.issue.deleteMany({ where: { reviewId: id } });
    await prisma.recommendation.deleteMany({ where: { reviewId: id } });

    // Update review record with exhaustive results
    const updated = await prisma.review.update({
      where: { id },
      data: {
        status: "COMPLETED",
        sourceCode: codeToAnalyze,
        overallScore: analysis.overallScore,
        qualityScore: analysis.qualityScore,
        securityScore: analysis.securityScore,
        performanceScore: analysis.performanceScore,
        maintainabilityScore: analysis.maintainabilityScore,
        optimizedCode: analysis.optimizedCode,
        summary: analysis.summary,
        aiProvider: analysis.provider,
        aiModel: analysis.model,
        processingTime: analysis.processingTime,
        tokensUsed: analysis.tokensUsed || null,
        issues: {
          create: analysis.issues.map((issue) => ({
            type: issue.type,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            lineStart: issue.lineStart ?? null,
            lineEnd: issue.lineEnd ?? null,
            suggestion: issue.suggestion ?? null,
            fixedCode: issue.fixedCode ?? null,
          })),
        },
        recommendations: {
          create: analysis.recommendations.map((rec) => ({
            category: rec.category,
            title: rec.title,
            description: rec.description,
            priority: rec.priority,
          })),
        },
      },
      include: {
        issues: true,
        recommendations: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Deep code analysis completed. All recommendations and metrics refreshed.",
    });
  } catch (error: any) {
    console.error("[Review/Rescan Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to perform deep code analysis" },
      { status: 500 }
    );
  }
}
