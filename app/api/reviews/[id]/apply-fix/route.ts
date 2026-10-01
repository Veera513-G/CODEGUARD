import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { issueId, fixedCode } = body;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { issues: true },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // Determine updated code
    const newCode = fixedCode || review.optimizedCode || review.sourceCode;

    // Calculate upgraded score (rewarding applied fix)
    const newOverallScore = Math.min(100, Math.max(90, (review.overallScore || 75) + 15));
    const newSecurityScore = Math.min(100, Math.max(95, (review.securityScore || 70) + 20));

    const updated = await prisma.review.update({
      where: { id },
      data: {
        sourceCode: newCode,
        overallScore: newOverallScore,
        securityScore: newSecurityScore,
        updatedAt: new Date(),
      },
      include: { issues: true, recommendations: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        review: updated,
        appliedIssueId: issueId,
        scoreGain: "+15 pts",
        xpAwarded: "+150 XP",
      },
    });
  } catch (error) {
    console.error("[ApplyFix/POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
