import Link from "next/link";
import { getTechBySlug, TECHS } from "../../../lib/techData";
import { TechIcon } from "../../../components/TechIcon";

type Props = {
  params: { tech: string };
};

export function generateStaticParams() {
  return TECHS.map((tech) => ({ tech: tech.slug }));
}

export default function TechPage({ params }: Props) {
  const tech = getTechBySlug(params.tech);

  if (!tech) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Technology not found</h1>
          <p className="mt-4 text-[var(--muted)]">We don't have information for that tech yet.</p>
          <Link href="/" className="mt-6 inline-block btn-outline">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{tech.name}</h1>
          <p className="mt-3 text-lg text-[var(--muted)] max-w-3xl">{tech.summary ?? tech.usage}</p>
        </div>
        <Link href="/tech" className="btn-outline self-start md:self-center">
          Back to Tech Index
        </Link>
      </div>

      <section className="card mb-6 flex flex-col gap-6 p-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--surface-alt)] shadow-sm">
            <TechIcon slug={tech.slug} className="h-12 w-12" />
          </div>
          <div>
            <div className="inline-flex rounded-full bg-[var(--surface-alt)] px-3 py-1 text-sm font-medium uppercase tracking-[0.15em] text-[var(--accent)]">
              {tech.category ?? "Technology"}
            </div>
            <p className="mt-4 text-[var(--muted)] max-w-2xl">{tech.usage}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/quote" className="btn-primary inline-flex items-center justify-center px-6 py-3">
            Start a project with {tech.name}
          </Link>
          {tech.docs && (
            <Link href={tech.docs} target="_blank" rel="noreferrer" className="btn-outline inline-flex items-center justify-center px-6 py-3">
              Official docs
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <main className="space-y-6">
          {tech.why && (
            <section className="card border-l-4 border-[var(--accent)] bg-[var(--surface)] p-6">
              <h2 className="text-2xl font-semibold mb-3">Why this stack?</h2>
              <p className="text-[var(--muted)]">{tech.why}</p>
            </section>
          )}
          <section className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Overview</h2>
                <p className="mt-3 text-[var(--muted)]">{tech.usage}</p>
              </div>
              {tech.category && (
                <span className="inline-flex rounded-full bg-[var(--surface-alt)] px-4 py-2 text-sm font-medium uppercase tracking-[0.15em] text-[var(--accent)]">
                  {tech.category}
                </span>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <ul className="grid gap-3 sm:grid-cols-2 list-disc pl-6 text-[var(--muted)]">
              {tech.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </section>

          {tech.useCases && tech.useCases.length > 0 && (
            <section className="card">
              <h2 className="text-2xl font-semibold mb-4">Use Cases</h2>
              <ul className="list-disc pl-6 text-[var(--muted)] space-y-2">
                {tech.useCases.map((useCase) => (
                  <li key={useCase}>{useCase}</li>
                ))}
              </ul>
            </section>
          )}

          {tech.examples && tech.examples.length > 0 && (
            <section className="card">
              <h2 className="text-2xl font-semibold mb-4">Examples</h2>
              <ul className="list-disc pl-6 text-[var(--muted)] space-y-2">
                {tech.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="text-xl font-semibold mb-3">Quick Facts</h2>
            <div className="space-y-3 text-[var(--muted)]">
              {tech.bestFor && tech.bestFor.length > 0 && (
                <div>
                  <p className="font-semibold text-[var(--text)] mb-2">Best for</p>
                  <ul className="list-disc pl-6 space-y-1">
                    {tech.bestFor.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tech.docs && (
                <div>
                  <p className="font-semibold text-[var(--text)] mb-2">Docs</p>
                  <a
                    href={tech.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    Official {tech.name} documentation
                  </a>
                </div>
              )}
            </div>
          </section>

          <section className="card bg-[var(--surface-alt)] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)] mb-3">Explore more</p>
            <div className="grid gap-3">
              {TECHS.filter((t) => t.slug !== tech.slug).slice(0, 4).map((t) => (
                <Link
                  key={t.slug}
                  href={`/tech/${t.slug}`}
                  className="block rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)]"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
