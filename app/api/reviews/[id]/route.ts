import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const review = await prisma.review.findFirst({
      where: { id, userId },
      include: {
        issues: { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
        recommendations: { orderBy: { priority: "asc" } },
        project: { select: { id: true, name: true } },
        repository: { select: { id: true, name: true, fullName: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("[Review/GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const review = await prisma.review.findFirst({ where: { id, userId } });
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("[Review/DELETE]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
