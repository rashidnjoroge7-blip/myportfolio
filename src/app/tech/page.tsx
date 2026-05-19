"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TECHS } from "../../lib/techData";
import { TechIcon } from "../../components/TechIcon";

export default function TechIndex() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(TECHS.map((tech) => tech.category ?? "Other"))
      ),
    ],
    []
  );

  const filteredTech = useMemo(
    () =>
      TECHS.filter((tech) => {
        const normalized = query.trim().toLowerCase();
        if (category !== "All" && tech.category !== category) {
          return false;
        }
        if (!normalized) return true;
        return [tech.name, tech.summary, tech.usage, tech.features.join(" ")]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(normalized));
      }),
    [category, query]
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-8">
        <h1 className="section-title">Tech Stack</h1>
        <p className="text-[var(--muted)]">Technologies we use, their purpose, and quick links to docs.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md w-full">
          <label htmlFor="tech-search" className="sr-only">
            Search tech stack
          </label>
          <input
            id="tech-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tech stack..."
            className="w-full rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                category === item
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--card-border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filteredTech.length === 0 ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
          No matching technologies were found. Try a different search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredTech.map((tech) => (
            <Link
              key={tech.slug}
              href={`/tech/${tech.slug}`}
              aria-label={`View more info about ${tech.name}`}
              className="group block cursor-pointer transform rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 transition hover:scale-105 hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--surface-alt)] shadow-sm">
                  <TechIcon slug={tech.slug} className="h-10 w-10" />
                </div>
                <div>
                  <div className="font-semibold text-lg">{tech.name}</div>
                  {tech.category && (
                    <div className="mt-1 inline-flex rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                      {tech.category}
                    </div>
                  )}
                  {tech.summary && <div className="text-sm text-[var(--muted)] mt-2">{tech.summary}</div>}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-[var(--muted)]">{tech.features.slice(0, 2).join(" • ")}</div>
                <span className="text-[var(--accent-2)] text-sm font-medium transition group-hover:underline">
                  Learn more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
