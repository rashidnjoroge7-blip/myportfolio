"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const THEME_KEY = "portfolio-theme";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/quote", label: "Quote", accent: true },
];

// Read saved theme
function getThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_KEY);

  return storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : "dark";
}

// Server-side snapshot prevents hydration mismatch
function getServerThemeSnapshot(): Theme {
  return "dark";
}

// Listen for theme changes
function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("portfolio-theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("portfolio-theme-change", callback);
  };
}

// Save and broadcast theme changes
function updateTheme(theme: Theme) {
  window.localStorage.setItem(THEME_KEY, theme);

  window.dispatchEvent(new Event("portfolio-theme-change"));
}

export default function ThemeNavbar() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Apply selected theme to the document
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollHeight = doc.scrollHeight - window.innerHeight;

      const progress =
        scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;

      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    const frame = window.requestAnimationFrame(handleScroll);

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    updateTheme(nextTheme);
  };

  return (
    <>
      {/* Scroll Progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-[var(--surface)]/0">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--surface)]/95 backdrop-blur-sm transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[var(--surface-alt)] shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="UniHost Technologies Logo"
                fill
                sizes="(max-width: 768px) 120px, 160px"
                className="object-cover p-1"
                priority
              />
            </div>

            <span className="bg-gradient-to-r from-[var(--accent-3)] to-[var(--accent-2)] bg-clip-text text-xl font-bold text-transparent">
              UniHost Technologies
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  item.accent
                    ? "text-[var(--accent-2)] hover:text-[var(--accent)]"
                    : "hover:text-[var(--accent)]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <Link href="/contact" className="btn-primary">
              Contact
            </Link>
          </div>

          {/* Theme and Mobile Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] p-2 text-[var(--text)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              aria-label="Toggle theme"
              title="Toggle light and dark mode"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] text-[var(--text)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)] md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`overflow-hidden transition-[max-height] duration-300 md:hidden ${
            menuOpen ? "max-h-64" : "max-h-0"
          }`}
        >
          <div className="space-y-2 border-t border-[var(--card-border)] bg-[var(--surface-alt)] px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 transition-colors ${
                  item.accent
                    ? "text-[var(--accent-2)] hover:bg-[var(--surface)]"
                    : "hover:bg-[var(--surface)]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/contact"
              className="block rounded-xl bg-[var(--accent)] px-4 py-3 text-center font-medium text-white transition hover:bg-[var(--accent-3)]"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
