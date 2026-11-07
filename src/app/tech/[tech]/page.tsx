import Link from "next/link";
import { getTechBySlug, TECHS } from "../../../lib/techData";
import { TechIcon } from "../../../components/TechIcon";

type Props = {
  params: Promise<{ tech: string }>;
};

export function generateStaticParams() {
  return TECHS.map((tech) => ({
    tech: tech.slug,
  }));
}

export default async function TechPage({ params }: Props) {
  const { tech: slug } = await params;
  const tech = getTechBySlug(slug);

  if (!tech) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Technology not found</h1>

          <p className="mt-4 text-[var(--muted)]">
            We don&apos;t have information for that tech yet.
          </p>

          <Link href="/" className="btn-outline mt-6 inline-block">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const relatedTech = TECHS.filter(
    (item) => item.slug !== tech.slug && item.category === tech.category,
  ).slice(0, 4);

  const features = tech.features ?? [];
  const useCases = tech.useCases ?? [];
  const examples = tech.examples ?? [];
  const bestFor = tech.bestFor ?? [];

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-10 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--accent)]">
            Home
          </Link>

          <span className="mx-2">/</span>

          <Link href="/tech" className="hover:text-[var(--accent)]">
            Tech Stack
          </Link>

          <span className="mx-2">/</span>

          <span className="text-[var(--text)]">{tech.name}</span>
        </div>

        {/* Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface)]">
              <TechIcon slug={tech.slug} className="h-12 w-12" />
            </div>

            <div>
              <span className="mb-3 inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                {tech.category}
              </span>

              <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
                {tech.name}
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
                {tech.summary ?? tech.usage}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Overview */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 md:p-8">
              <h2 className="mb-4 text-2xl font-semibold text-[var(--text)]">
                Overview
              </h2>

              <p className="leading-8 text-[var(--muted)]">
                {tech.usage}
              </p>
            </section>

            {/* Why I Use It */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 md:p-8">
              <h2 className="mb-4 text-2xl font-semibold text-[var(--text)]">
                Why I Use {tech.name}
              </h2>

              <p className="leading-8 text-[var(--muted)]">
                {tech.why}
              </p>
            </section>

            {/* Features */}
            {features.length > 0 && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-semibold text-[var(--text)]">
                  Key Features
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <div
                      key={`${feature}-${index}`}
                      className="flex items-start gap-3 rounded-xl bg-[var(--surface-alt)] p-4"
                    >
                      <span className="mt-1 text-[var(--accent)]">✓</span>

                      <p className="text-sm leading-relaxed text-[var(--text)]">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Use Cases */}
            {useCases.length > 0 && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-semibold text-[var(--text)]">
                  What I Use It For
                </h2>

                <div className="space-y-3">
                  {useCases.map((useCase, index) => (
                    <div
                      key={`${useCase}-${index}`}
                      className="flex items-start gap-3"
                    >
                      <span className="text-[var(--accent)]">→</span>

                      <p className="text-[var(--muted)]">{useCase}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Examples */}
            {examples.length > 0 && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-semibold text-[var(--text)]">
                  Practical Applications
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {examples.map((example, index) => (
                    <div
                      key={`${example}-${index}`}
                      className="rounded-xl border border-[var(--card-border)] p-4"
                    >
                      <p className="text-sm leading-relaxed text-[var(--muted)]">
                        {example}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Best For */}
            {bestFor.length > 0 && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-semibold text-[var(--text)]">
                  Best Suited For
                </h2>

                <div className="flex flex-wrap gap-3">
                  {bestFor.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] px-4 py-2 text-sm text-[var(--text)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Facts */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="mb-6 text-xl font-semibold text-[var(--text)]">
                Quick Facts
              </h2>

              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                    Technology
                  </p>

                  <p className="mt-1 font-medium text-[var(--text)]">
                    {tech.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                    Category
                  </p>

                  <p className="mt-1 font-medium text-[var(--text)]">
                    {tech.category}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                    Slug
                  </p>

                  <p className="mt-1 font-medium text-[var(--text)]">
                    {tech.slug}
                  </p>
                </div>
              </div>

              {tech.docs && (
                <a
                  href={tech.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 block rounded-xl bg-[var(--accent)] px-5 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Official {tech.name} Documentation ↗
                </a>
              )}
            </section>

            {/* Related Technologies */}
            {relatedTech.length > 0 && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
                <h2 className="mb-5 text-xl font-semibold text-[var(--text)]">
                  Explore More
                </h2>

                <div className="space-y-4">
                  {relatedTech.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/tech/${item.slug}`}
                      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--surface-alt)]"
                    >
                      <TechIcon
                        slug={item.slug}
                        className="h-8 w-8 shrink-0"
                      />

                      <span className="font-medium text-[var(--text)]">
                        {item.name}
                      </span>

                      <span className="ml-auto text-[var(--muted)]">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        {/* Navigation */}
        <div className="mt-16 border-t border-[var(--card-border)] pt-8">
          <Link
            href="/tech"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← Back to Tech Stack
          </Link>
        </div>
      </div>
    </main>
  );}
