import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { safeFirestoreSet, safeFirestoreGet } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const userIdHeader = request.headers.get("x-user-id");
    let userId = userIdHeader;

    if (!userId && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      if (payload) userId = payload.sub;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Try fetching extra profile metadata from Firebase Firestore if available
    const firestoreData = await safeFirestoreGet("users", user.providerId || user.id);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          provider: user.provider,
          providerId: user.providerId,
          bio: user.bio,
          website: user.website,
          company: user.company,
          createdAt: user.createdAt,
          subscription: user.subscription,
          firestoreProfile: firestoreData,
        },
      },
    });
  } catch (error) {
    console.error("[User Profile GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userIdHeader = request.headers.get("x-user-id");
    const authHeader = request.headers.get("authorization");
    let userId = userIdHeader;

    if (!userId && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      if (payload) userId = payload.sub;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, website, company, avatarUrl } = body;

    // Update Prisma DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(company !== undefined && { company }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: { subscription: true },
    });

    // Update Firebase Firestore Database (no-ops if not configured)
    const docId = updatedUser.providerId || updatedUser.id;
    await safeFirestoreSet("users", docId, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      provider: updatedUser.provider,
      bio: updatedUser.bio,
      website: updatedUser.website,
      company: updatedUser.company,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl,
          role: updatedUser.role,
          provider: updatedUser.provider,
          bio: updatedUser.bio,
          website: updatedUser.website,
          company: updatedUser.company,
          createdAt: updatedUser.createdAt,
          subscription: updatedUser.subscription,
        },
      },
    });
  } catch (error) {
    console.error("[User Profile PUT]", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
