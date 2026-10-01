import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeCode } from "@/lib/ai/engine";
import { createReviewSchema } from "@/lib/validators";

import { verifyAccessToken } from "@/lib/auth";

function getUserId(request: Request): string | null {
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (payload?.sub) return payload.sub;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") || undefined;
    const language = searchParams.get("language") || undefined;

    const where = {
      userId,
      ...(status && { status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" }),
      ...(language && { language }),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { issues: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: reviews,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[Reviews/GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription scan limit
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (subscription && subscription.scansUsed >= subscription.scansLimit) {
      return NextResponse.json(
        { success: false, error: "Monthly scan limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createReviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, language, sourceType, sourceCode, fileName, projectId } = result.data;

    // Create review with PROCESSING status
    const review = await prisma.review.create({
      data: {
        title,
        language,
        sourceType,
        sourceCode,
        fileName,
        status: "PROCESSING",
        userId,
        ...(projectId && { projectId }),
      },
    });

    // Increment scan counter
    if (subscription) {
      await prisma.subscription.update({
        where: { userId },
        data: { scansUsed: { increment: 1 } },
      });
    }

    // Run AI analysis (async in production, sync here for simplicity)
    try {
      const analysis = await analyzeCode({ code: sourceCode, language });

      // Update review with results
      const updatedReview = await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "COMPLETED",
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
          tokensUsed: analysis.tokensUsed,
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

      return NextResponse.json({ success: true, data: updatedReview }, { status: 201 });
    } catch (aiError) {
      // Mark review as failed
      await prisma.review.update({
        where: { id: review.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { success: false, error: "AI analysis failed. Please configure an AI provider API key." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Reviews/POST]", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
