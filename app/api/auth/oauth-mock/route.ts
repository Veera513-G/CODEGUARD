import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { safeFirestoreSet } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { provider } = await request.json();

    if (provider !== "github" && provider !== "google") {
      return NextResponse.json(
        { success: false, error: "Invalid provider" },
        { status: 400 }
      );
    }

    const email = `${provider}-demo@codeguard.ai`;
    const name = provider === "github" ? "GitHub Demo User" : "Google Demo User";
    const avatarUrl =
      provider === "github"
        ? "https://avatars.githubusercontent.com/u/9919?v=4" // GitHub logo avatar
        : "https://lh3.googleusercontent.com/COxitlgo4v48zCXt4w6QrHgxbtV5G83aKlp7584rTR50OMgPHLR7jaV9g507I5tT2-C1Xg=s360"; // Google search icon

    // Find or create mock user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          provider: provider.toUpperCase() as "GITHUB" | "GOOGLE",
          emailVerified: true,
          subscription: {
            create: {
              plan: "PRO",
              status: "ACTIVE",
              scansLimit: 500,
            },
          },
        },
        include: { subscription: true },
      });
    }

    // Persist profile into Firebase Firestore Database (no-ops if not configured)
    await safeFirestoreSet("users", user.id, {
      id: user.id,
      uid: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
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
          expiresIn: 15 * 60 * 1000, // 15 minutes in ms
        },
      },
    });

    // Set auth cookie
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth/OAuth-Mock]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
