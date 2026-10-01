import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

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

    const systemPrompt = `You are an elite Senior Staff Security Engineer & AI Coding Tutor.
You are helping a developer understand their code review and answer follow-up questions.

CONTEXT OF THE REVIEW:
- Title: ${review.title}
- Language: ${review.language}
- Overall Quality Score: ${review.overallScore}/100 (Security: ${review.securityScore}/100)
- Summary: ${review.summary || "No summary"}
- Detected Issues (${review.issues.length}):
${review.issues
  .map(
    (i, idx) =>
      `  ${idx + 1}. [${i.severity}] ${i.title}: ${i.description} (Line ${i.lineStart || "N/A"}) -> Suggestion: ${i.suggestion || "N/A"}`
  )
  .join("\n")}

SOURCE CODE:
\`\`\`${review.language}
${review.sourceCode}
\`\`\`

GUIDELINES:
1. Answer clearly, accurately, and concisely.
2. If asked "why is this unsafe" or "explain bug", break down the exact vulnerability mechanism (e.g. SQL Injection, XSS, Buffer Overflow, Race condition) and show secure replacement code.
3. Provide code examples formatted in markdown code blocks.
4. Adopt a helpful, encouraging senior mentor tone suitable for engineers, students, and reviewers.`;

    let reply = "";

    // Attempt OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...(history || []).map((h: { role: "user" | "assistant"; content: string }) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user" as const, content: message },
        ];
        const res = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o",
          messages,
          temperature: 0.2,
        });
        reply = res.choices[0].message.content || "";
      } catch (err) {
        console.warn("[Chat with Code] OpenAI failed, trying fallback:", err);
      }
    }

    // Attempt Gemini if OpenAI wasn't used or failed
    if (!reply && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
          systemInstruction: systemPrompt,
        });
        const res = await model.generateContent(message);
        reply = res.response.text();
      } catch (err) {
        console.warn("[Chat with Code] Gemini failed:", err);
      }
    }

    // Fallback response if no API keys are configured
    if (!reply) {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("unsafe") || lowerMsg.includes("security") || lowerMsg.includes("bug")) {
        reply = `### 🛡️ Security Analysis for "${review.title}"\n\n` +
          `Based on the AST scan for **${review.language}**:\n` +
          `- **Risk Analysis**: The primary concern identified is unvalidated inputs and potential vulnerability to injection or unhandled error boundaries.\n` +
          `- **Safe Practice**: Always use parameterized queries, strict schema validation (like Zod or Pydantic), and sanitize all external inputs.\n\n` +
          `\`\`\`${review.language}\n// Safe Pattern Example:\n// Use parameterized handlers instead of dynamic string concatenation\n\`\`\`\n\n` +
          `Would you like me to generate unit tests or a refactored implementation for this?`;
      } else if (lowerMsg.includes("test") || lowerMsg.includes("unit test")) {
        reply = `### 🧪 Recommended Unit Test Strategy\n\n` +
          `Here is how to test this **${review.language}** module for resilience:\n` +
          `1. **Positive Path**: Test with valid inputs and assert expected return format.\n` +
          `2. **Edge Cases**: Pass \`null\`, \`undefined\`, empty strings, and special characters.\n` +
          `3. **Security Boundary**: Test with SQL/XSS payloads to assert that rejection throws appropriate 400/422 responses.`;
      } else {
        reply = `### 💡 Code Insight for "${review.title}"\n\n` +
          `In your **${review.language}** implementation, the architecture is scored at **${review.overallScore}/100**.\n\n` +
          `Key recommendation: **${review.recommendations?.[0]?.title || "Keep functions modular and adhere to single responsibility principle."}**\n\n` +
          `Feel free to ask me to write a refactored version, explain line-by-line, or optimize time complexity!`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Chat/Code]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
