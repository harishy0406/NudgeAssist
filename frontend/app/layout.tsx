import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NudgeAssist — AI-Powered Internal Support",
  description: "AI-native internal ticketing platform for The/Nudge Institute. Raise, track, and resolve support requests with AI-powered categorization, similarity search, and agent copilot.",
  keywords: "ticketing, AI, support, The Nudge Institute, NudgeAssist",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
