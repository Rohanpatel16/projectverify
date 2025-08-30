import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadSpark - Modern Email Finder & Verification Tool",
  description: "Discover and verify email addresses for your outreach campaigns with LeadSpark's powerful email verification platform.",
  keywords: ["email verification", "email finder", "lead generation", "email validation", "outreach"],
  authors: [{ name: "LeadSpark Team" }],
  openGraph: {
    title: "LeadSpark - Email Verification Platform",
    description: "Powerful email finder and verification tool for modern businesses",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadSpark - Email Verification Platform",
    description: "Powerful email finder and verification tool for modern businesses",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
