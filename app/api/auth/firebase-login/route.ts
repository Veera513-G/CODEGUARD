import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { adminAuth, safeFirestoreSet } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, provider, email, name, avatarUrl, providerId } = body;

    let userEmail = email;
    let userName = name;
    let userAvatar = avatarUrl;
    let uid = providerId;

    // Verify Firebase ID token if provided
    if (idToken && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userEmail = decodedToken.email || userEmail;
        userName = decodedToken.name || userName;
        userAvatar = decodedToken.picture || userAvatar;
        uid = decodedToken.uid || uid;
      } catch (tokenError) {
        console.warn("[Auth/Firebase] ID Token verification skipped/failed, proceeding with payload data:", tokenError);
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Email is required for authentication" },
        { status: 400 }
      );
    }

    const authProvider = provider?.toUpperCase() === "GITHUB" ? "GITHUB" : "GOOGLE";

    // Find existing user or create a new user profile
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName || (authProvider === "GITHUB" ? "GitHub User" : "Google User"),
          avatarUrl: userAvatar || null,
          provider: authProvider,
          providerId: uid || null,
          emailVerified: true,
          subscription: {
            create: {
              plan: "FREE",
              status: "ACTIVE",
              scansLimit: 50,
            },
          },
        },
        include: { subscription: true },
      });
    } else {
      // Update existing user profile avatar/name/provider if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || userName,
          avatarUrl: user.avatarUrl || userAvatar,
          providerId: user.providerId || uid,
          emailVerified: true,
        },
        include: { subscription: true },
      });
    }

    // Persist/Sync user profile into Firebase Firestore Database (no-ops if not configured)
    const docId = uid || user.id;
    await safeFirestoreSet("users", docId, {
      id: user.id,
      uid: uid || user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      providerId: user.providerId,
      emailVerified: user.emailVerified,
      role: user.role,
      bio: user.bio || null,
      website: user.website || null,
      company: user.company || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            scansUsed: user.subscription.scansUsed,
            scansLimit: user.subscription.scansLimit,
          }
        : null,
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken(user.id);

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          emailVerified: user.emailVerified,
          provider: user.provider,
          bio: user.bio,
          website: user.website,
          company: user.company,
          createdAt: user.createdAt,
          subscription: user.subscription
            ? {
                plan: user.subscription.plan,
                status: user.subscription.status,
                scansUsed: user.subscription.scansUsed,
                scansLimit: user.subscription.scansLimit,
              }
            : null,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60 * 1000,
        },
      },
    });

    // Set auth session cookie
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth/Firebase-Login]", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
