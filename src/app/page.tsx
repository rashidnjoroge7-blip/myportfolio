import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "../lib/siteConfig";
import { TECHS } from "../lib/techData";
import { getPublishedProjects } from "@/lib/projects";

export default async function Home() {
  const featuredProjects = (await getPublishedProjects())
    .filter((project) => project.featured)
    .slice(0, 3);

  return (
    <div className="bg-[var(--bg)]">
      {/* Hero Section */}
      <section
        id="hero"
        className="flex min-h-screen items-center justify-center px-6 py-20 fade-in"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="stagger-1">
              <div className="mb-6 inline-block rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2">
                <p className="text-sm text-[var(--accent-2)]">
                  Welcome to UniHost Technologies
                </p>
              </div>

              <h1 className="section-title mb-6 text-5xl md:text-6xl">
                Hi, I&apos;m {siteConfig.name}
              </h1>

              <p className="mb-8 text-xl text-[var(--muted)]">
                {siteConfig.tagline}. Let&apos;s build something extraordinary
                together.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/projects"
                  className="btn-primary px-8 py-3 text-lg"
                >
                  View My Work
                </Link>

                <Link href="/contact" className="btn-outline px-8 py-3 text-lg">
                  Get In Touch
                </Link>
              </div>

              {/* Highlights */}
              <div className="mt-12 grid grid-cols-3 gap-5">
                <div>
                  <p className="text-3xl font-bold text-[var(--accent-3)]">
                    Projects
                  </p>
                  <p className="text-sm text-[var(--muted)]">Selected work</p>
                </div>

                <div>
                  <p className="text-3xl font-bold text-[var(--accent-2)]">
                    Modern
                  </p>
                  <p className="text-sm text-[var(--muted)]">Web experiences</p>
                </div>

                <div>
                  <p className="text-3xl font-bold text-[var(--accent-3)]">
                    Reliable
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Delivery mindset
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden justify-center stagger-2 md:flex">
              <div className="relative w-full max-w-md rounded-2xl border-2 border-[var(--card-border)] bg-[var(--surface)] p-8 shadow-2xl">
                <div className="rounded-xl bg-gradient-to-br from-[var(--accent-3)] to-[var(--accent-2)] p-1">
                  <div className="flex min-h-56 items-center justify-center rounded-lg bg-[var(--surface)] p-10 text-center">
                    <div>
                      <div className="mb-4 text-6xl">💻</div>
                      <p className="font-semibold text-[var(--accent-3)]">
                        Digital products built with care
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-3 rounded-b-lg border-t border-[var(--card-border)] bg-[var(--surface-alt)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-[var(--accent)]">
                  Selected work
                </p>

                <h2 className="section-title mt-2">Featured projects</h2>
              </div>

              <Link
                href="/projects"
                className="text-[var(--accent-2)] hover:underline"
              >
                All projects →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredProjects.map((project) => (
                <article key={project.id} className="card">
                  {project.image_url ? (
                    <Image
                      src={project.image_url}
                      alt={project.title}
                      width={800}
                      height={450}
                      unoptimized
                      className="mb-4 aspect-video w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-[var(--surface-alt)] text-5xl">
                      💻
                    </div>
                  )}

                  <h3 className="mb-2 text-xl font-semibold">
                    {project.title}
                  </h3>

                  <p className="line-clamp-3 text-sm text-[var(--muted)]">
                    {project.description}
                  </p>

                  <Link
                    href="/projects"
                    className="mt-4 inline-block text-sm text-[var(--accent-2)]"
                  >
                    Project details →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card">
              <div className="mb-4 text-4xl">💻</div>
              <h3 className="mb-2 text-xl font-semibold">Web Development</h3>
              <p className="text-[var(--muted)]">
                Creating responsive, performant web applications.
              </p>
            </div>

            <div className="card">
              <div className="mb-4 text-4xl">🎨</div>
              <h3 className="mb-2 text-xl font-semibold">UI/UX Design</h3>
              <p className="text-[var(--muted)]">
                Designing intuitive and useful interfaces.
              </p>
            </div>

            <div className="card">
              <div className="mb-4 text-4xl">⚡</div>
              <h3 className="mb-2 text-xl font-semibold">Performance</h3>
              <p className="text-[var(--muted)]">
                Building optimized digital solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tech-stack" className="bg-[var(--surface)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="section-title mb-12 text-center">Tech Stack</h2>

          <div className="grid gap-4 md:grid-cols-4">
            {TECHS.map((tech) => (
              <Link
                key={tech.slug}
                href={`/tech/${tech.slug}`}
                className="card block text-center"
              >
                <div className="mb-2 text-3xl">{tech.icon ?? "🔧"}</div>

                <p className="font-semibold">{tech.name}</p>

                {tech.summary && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {tech.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--accent)] bg-gradient-to-r from-[var(--accent-3)] to-[var(--accent-2)] p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to work together?
          </h2>

          <p className="mb-8 text-[var(--text)]/80">
            Let&apos;s discuss your next project.
          </p>

          <Link href="/contact" className="btn-secondary">
            Start a Conversation
          </Link>
        </div>
      </section>
    </div>
  );
}
