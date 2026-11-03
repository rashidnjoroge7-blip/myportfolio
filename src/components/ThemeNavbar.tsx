"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/quote", label: "Quote", accent: true },
];

export default function ThemeNavbar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("portfolio-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      const progress =
        scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 h-1 z-50 bg-[var(--surface)]/0">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--card-border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[var(--surface-alt)] shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/logo.svg"
                alt="Unihost Technologies Logo"
                fill
                className="object-cover p-1"
                priority
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--accent-3)] to-[var(--accent-2)] bg-clip-text text-transparent">
              UniHost Technologies
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${item.accent ? "text-[var(--accent-2)] hover:text-[var(--accent)]" : "hover:text-[var(--accent)]"}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" className="btn-primary">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setTheme((value) => (value === "dark" ? "light" : "dark"))
              }
              className="rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] p-2 text-[var(--text)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] text-[var(--text)] shadow-sm md:hidden transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${menuOpen ? "max-h-64" : "max-h-0"}`}
        >
          <div className="space-y-2 border-t border-[var(--card-border)] bg-[var(--surface-alt)] px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 transition-colors ${item.accent ? "text-[var(--accent-2)] hover:bg-[var(--surface)]" : "hover:bg-[var(--surface)]"}`}
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
