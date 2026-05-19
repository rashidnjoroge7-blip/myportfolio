import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeNavbar from "../components/ThemeNavbar";
import RouteTransition from "../components/RouteTransition";
import { siteConfig } from "../lib/siteConfig";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.company,
  description: `Welcome to ${siteConfig.company}'s professional portfolio`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
        <ThemeNavbar />

        <main className="flex-1">
          <RouteTransition>{children}</RouteTransition>
        </main>

        <footer className="border-t border-[var(--card-border)] bg-[var(--surface)] mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12 text-center text-[var(--muted)]">
            <p>&copy; 2026 {siteConfig.company}. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
