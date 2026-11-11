"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { PortfolioProject } from "@/lib/projectSchema";

interface Props {
  projects: PortfolioProject[];
  github: string;
}

export default function ProjectsClient({ projects, github }: Props) {
  const [activeTech, setActiveTech] = useState("All");

  const technologies = useMemo(
    () => [...new Set(projects.flatMap((project) => project.tags))].sort(),
    [projects],
  );

  const filteredProjects =
    activeTech === "All"
      ? projects
      : projects.filter((project) => project.tags.includes(activeTech));

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Projects Header */}
      <section className="border-b border-[var(--card-border)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="section-title mb-4">My Projects</h1>

          <p className="section-subtitle">
            A collection of recent projects showcasing my skills in web
            development and design.
          </p>

          {/* Technology Filters */}
          <div className="mt-8 flex flex-wrap gap-3">
            {["All", ...technologies].map((tech) => (
              <button
                key={tech}
                onClick={() => setActiveTech(tech)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  activeTech === tech
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--card-border)] bg-[var(--surface-alt)] text-[var(--text)]"
                }`}
              >
                {tech}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-[var(--muted)]">
            Showing {filteredProjects.length} of {projects.length} projects.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          {filteredProjects.length === 0 ? (
            <p className="py-12 text-center text-[var(--muted)]">
              No projects available yet.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, index) => (
                <article
                  key={project.id}
                  className={`card project-card group flex flex-col overflow-hidden hover-card stagger-${(index % 5) + 1}`}
                >
                  {project.image_url ? (
                    <Image
                      src={project.image_url}
                      alt={project.title}
                      width={800}
                      height={450}
                      unoptimized
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-[var(--surface-alt)] text-5xl">
                      &lt;/&gt;
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                  {/* Project Details */}
                  <p className="mb-2 text-xs uppercase text-[var(--accent-2)]">
                    {project.category}
                  </p>

                  <h2 className="mb-2 text-xl font-semibold text-[var(--accent-3)]">
                    {project.title}
                  </h2>

                  <p className="mb-4 line-clamp-3 text-[var(--muted)]">
                    {project.description}
                  </p>

                  {/* Technology Tags */}
                  <div className="mb-5 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] px-3 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Project Actions */}
                  <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-[var(--card-border)] pt-4">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--accent-2)] transition hover:opacity-75"
                      >
                        Live Demo ↗
                      </a>
                    )}

                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--accent-2)] transition hover:opacity-75"
                      >
                        Source Code ↗
                      </a>
                    )}

                    {/* Get a Quote */}
                    <Link
                      href={`/quote?project=${encodeURIComponent(project.title)}`}
                      className="ml-auto inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                    >
                      Get a Quote →
                    </Link>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* GitHub / Contact CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--card-border)] bg-[var(--surface)] p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Interested in seeing more?
          </h2>

          <p className="mb-8 text-[var(--muted)]">
            Check out my GitHub or contact me to discuss custom projects.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              View on GitHub
            </a>

            <a href="/contact" className="btn-secondary">
              Let&apos;s Talk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
