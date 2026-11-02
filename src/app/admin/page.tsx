import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const { data, error } = await getSupabaseAdmin().from("projects").select("id,status,featured");
  const projects = data ?? [];
  const stats = [
    ["All projects", error ? "—" : String(projects.length)],
    ["Published", error ? "—" : String(projects.filter((p) => p.status === "published").length)],
    ["Drafts", error ? "—" : String(projects.filter((p) => p.status === "draft").length)],
    ["Featured", error ? "—" : String(projects.filter((p) => p.featured).length)],
  ];
  return <main className="min-h-screen px-6 py-12"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Portfolio CMS</p><h1 className="mt-2 text-4xl font-bold">Admin dashboard</h1><p className="mt-2 text-[var(--muted)]">Signed in as {session.user?.email}</p></div><div className="flex gap-3"><Link href="/admin/projects" className="btn-secondary">Manage projects</Link><Link href="/admin/projects/new" className="btn-primary">+ Add project</Link></div></div>
    {error && <p role="alert" className="mt-8 rounded-xl border border-red-500/40 p-4 text-sm">Could not read the projects table. Apply the Supabase migration and check your environment variables.</p>}
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-4xl font-bold">{value}</p></div>)}</div>
    <section className="mt-10 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6"><h2 className="text-xl font-semibold">Quick start</h2><ol className="mt-4 list-inside list-decimal space-y-2 text-[var(--muted)]"><li>Create a project and add a short description.</li><li>Add an HTTPS live-demo link and cover image.</li><li>Save as a draft until it is ready.</li><li>Publish it when you want it visible on the public Projects page.</li></ol></section>
  </div></main>;
}
