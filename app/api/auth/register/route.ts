import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { authRateLimit } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { success: rateLimitOk } = await authRateLimit(ip);
    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        emailVerified: false,
        provider: "EMAIL",
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
            scansLimit: 20,
          },
        },
      },
      include: { subscription: true },
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken(user.id);

    const response = NextResponse.json(
      {
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
            createdAt: user.createdAt,
            subscription: {
              plan: user.subscription!.plan,
              status: user.subscription!.status,
              scansUsed: user.subscription!.scansUsed,
              scansLimit: user.subscription!.scansLimit,
            },
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 * 1000,
          },
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth/Register]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
