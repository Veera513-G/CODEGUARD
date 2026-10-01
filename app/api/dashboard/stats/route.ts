import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalReviews,
      completedReviews,
      totalIssues,
      criticalIssues,
      recentReviews,
      subscription,
      trendData,
      avgScoreResult,
    ] = await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.review.count({ where: { userId, status: "COMPLETED" } }),
      prisma.issue.count({ where: { review: { userId } } }),
      prisma.issue.count({ where: { review: { userId }, severity: "CRITICAL" } }),
      prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { issues: true } } },
      }),
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.review.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
          status: "COMPLETED",
        },
        select: {
          createdAt: true,
          overallScore: true,
          securityScore: true,
          qualityScore: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.review.aggregate({
        where: { userId, status: "COMPLETED" },
        _avg: { overallScore: true },
      }),
    ]);

    const avgScore =
      completedReviews > 0
        ? Math.round(avgScoreResult._avg.overallScore || 0)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalReviews,
          completedReviews,
          totalIssues,
          criticalIssues,
          avgScore,
          scansUsed: subscription?.scansUsed || 0,
          scansLimit: subscription?.scansLimit || 20,
          plan: subscription?.plan || "FREE",
        },
        recentReviews,
        trendData: trendData.map((r) => ({
          date: r.createdAt.toISOString().split("T")[0],
          overallScore: r.overallScore,
          securityScore: r.securityScore,
          qualityScore: r.qualityScore,
        })),
      },
    });
  } catch (error) {
    console.error("[Dashboard/Stats]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
