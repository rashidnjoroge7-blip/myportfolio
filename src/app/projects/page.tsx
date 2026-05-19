"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "../../lib/siteConfig";

export default function Projects() {
  const projects = siteConfig.projects;

  const technologies = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.tags))).sort(),
    [projects]
  );

  const [activeTech, setActiveTech] = useState("All");

  const filteredProjects =
    activeTech === "All"
      ? projects
      : projects.filter((project) => project.tags.includes(activeTech));

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {/* Header */}
      <section id="projects" className="py-20 px-6 border-b border-[var(--card-border)] fade-in">
        <div className="max-w-5xl mx-auto">
          <h1 className="section-title mb-4">My Projects</h1>
          <p className="section-subtitle">
            A collection of recent projects showcasing my skills in web development and design.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {['All', ...technologies].map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => setActiveTech(tech)}
                className={`rounded-full border px-4 py-2 text-sm transition focus:outline-none ${
                  activeTech === tech
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--card-border)] bg-[var(--surface-alt)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
      <section className="py-20 px-6 fade-in">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const staggerClass = `stagger-${(index % 5) + 1}`;
              return (
                <div key={project.id} className={`card group cursor-pointer hover-card ${staggerClass}`}>
                  <div className="text-5xl mb-4">{project.image}</div>
                  <h3 className="text-xl font-semibold text-[var(--accent-3)] mb-2 group-hover:text-[var(--accent-2)] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[var(--muted)] mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[var(--surface-alt)] border border-[var(--card-border)] text-[var(--accent-3)] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    href={project.link}
                    className="inline-block text-[var(--accent-2)] hover:text-[var(--accent)] transition-colors font-medium"
                  >
                    View Project →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 fade-in">
        <div className="max-w-4xl mx-auto text-center bg-[var(--surface)] rounded-3xl p-12 border border-[var(--card-border)] shadow-xl shadow-[rgba(56,189,248,0.10)]">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Interested in seeing more?</h2>
          <p className="text-[var(--muted)] mb-8">
            Check out my GitHub or contact me to discuss custom projects.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href={siteConfig.github} target="_blank" rel="noreferrer" className="btn-primary">
              View on GitHub
            </a>
            <a href="/contact" className="btn-secondary">
              Let's Talk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
