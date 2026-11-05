import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const supabase = getSupabaseAdmin();

  const [
    { data: projectData, error: projectError },
    { data: quoteData, error: quoteError },
  ] = await Promise.all([
    supabase.from("projects").select("id,status,featured"),
    supabase.from("quote_requests").select("id,status"),
  ]);

  const projects = projectData ?? [];
  const quotes = quoteData ?? [];

  const stats = [
    {
      label: "All projects",
      value: projectError ? "—" : String(projects.length),
    },
    {
      label: "Published",
      value: projectError
        ? "—"
        : String(projects.filter((p) => p.status === "published").length),
    },
    {
      label: "Drafts",
      value: projectError
        ? "—"
        : String(projects.filter((p) => p.status === "draft").length),
    },
    {
      label: "Featured",
      value: projectError
        ? "—"
        : String(projects.filter((p) => p.featured).length),
    },
    {
      label: "Quote requests",
      value: quoteError ? "—" : String(quotes.length),
    },
    {
      label: "Pending quotes",
      value: quoteError
        ? "—"
        : String(quotes.filter((q) => q.status === "pending").length),
    },
  ];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
              Portfolio CMS
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Admin dashboard
            </h1>

            <p className="mt-2 text-[var(--muted)]">
              Signed in as {session.user?.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/projects" className="btn-secondary">
              Manage projects
            </Link>

            <Link href="/admin/quotes" className="btn-secondary">
              Manage quotations
            </Link>

            <Link href="/admin/projects/new" className="btn-primary">
              + Add project
            </Link>
          </div>
        </div>

        {projectError && (
          <p role="alert" className="mt-8 rounded-xl border border-red-500/40 p-4 text-sm">
            Could not read the projects table. Check your Supabase configuration.
          </p>
        )}

        {quoteError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-500/40 p-4 text-sm">
            Could not read quotation requests. Check your quote_requests table.
          </p>
        )}

        <h2 className="mt-10 text-xl font-semibold">
          Business overview
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5"
            >
              <p className="text-sm text-[var(--muted)]">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-bold">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-2">

          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">
              Project management
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Manage your portfolio projects, descriptions, images and publication status.
            </p>

            <Link href="/admin/projects" className="btn-secondary mt-5 inline-block">
              Open projects
            </Link>
          </div>

          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
            <h2 className="text-xl font-semibold">
              Quotation management
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Review client enquiries, evaluate budgets, update quotation progress and contact potential clients.
            </p>

            <Link href="/admin/quotes" className="btn-primary mt-5 inline-block">
              Open quotations
            </Link>
          </div>

        </section>

        <section className="mt-10 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-semibold">
            Quick start
          </h2>

          <ol className="mt-4 list-inside list-decimal space-y-2 text-[var(--muted)]">
            <li>Create a project and add a short description.</li>
            <li>Add an HTTPS live-demo link and cover image.</li>
            <li>Save as a draft until it is ready.</li>
            <li>Publish it when you want it visible on the public Projects page.</li>
            <li>Review incoming quotation requests regularly.</li>
          </ol>
        </section>

      </div>
    </main>
  );
}
