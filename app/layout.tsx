import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CodeGuard AI — AI-Powered Code Review",
    template: "%s | CodeGuard AI",
  },
  description:
    "Automatically review code, detect bugs, identify security vulnerabilities, and get AI-powered optimization suggestions. Enterprise-grade code quality for every developer.",
  keywords: [
    "code review",
    "AI code analysis",
    "security vulnerabilities",
    "bug detection",
    "code quality",
    "static analysis",
  ],
  authors: [{ name: "CodeGuard AI Team" }],
  creator: "CodeGuard AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "CodeGuard AI — AI-Powered Code Review",
    description:
      "Detect bugs, security issues, and performance problems in your code with AI.",
    siteName: "CodeGuard AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeGuard AI",
    description: "AI-Powered Code Review Assistant",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(51, 65, 85, 0.6)",
                color: "#e2e8f0",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
