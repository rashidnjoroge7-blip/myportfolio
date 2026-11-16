import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteProject, toggleProjectStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const { data, error } = await getSupabaseAdmin().from("projects").select("*").order("updated_at", { ascending: false });
  const projects = data ?? [];
  return <main className="min-h-screen px-6 py-12"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="text-sm text-[var(--accent-2)] hover:underline">← Dashboard</Link><h1 className="mt-3 text-4xl font-bold">Projects</h1><p className="mt-2 text-[var(--muted)]">Create, edit, publish, or remove portfolio projects.</p></div><Link href="/admin/projects/new" className="btn-primary">+ Add project</Link></div>
    {params.saved && <p className="mt-6 rounded-xl border border-green-500/40 p-3 text-sm">Changes saved.</p>}
    {params.deleted && <p className="mt-6 rounded-xl border border-green-500/40 p-3 text-sm">Project deleted.</p>}
    {params.error && <p role="alert" className="mt-6 rounded-xl border border-red-500/40 p-3 text-sm">The action could not be completed. Check the project details and Supabase setup.</p>}
    {error ? <p className="mt-8 rounded-xl border border-red-500/40 p-4">Could not load projects. Apply the SQL migration and check your Supabase environment variables.</p> : projects.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-[var(--card-border)] p-12 text-center"><p className="text-lg font-semibold">No projects yet</p><p className="mt-2 text-[var(--muted)]">Add your first project to get started.</p><Link href="/admin/projects/new" className="btn-primary mt-6 inline-block">Create first project</Link></div> : <div className="mt-8 space-y-3">{projects.map((project) => <article key={project.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{project.title}</h2><span className="rounded-full border border-[var(--card-border)] px-2 py-1 text-xs">{project.status}</span>{project.featured && <span className="rounded-full bg-[var(--accent)]/10 px-2 py-1 text-xs text-[var(--accent)]">Featured</span>}</div><p className="mt-1 max-w-2xl truncate text-sm text-[var(--muted)]">{project.description}</p><p className="mt-2 text-xs text-[var(--muted)]">{(project.tags ?? []).join(" · ")}</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/projects/${project.id}`} className="btn-secondary">Edit</Link><form action={toggleProjectStatus}><input type="hidden" name="id" value={project.id}/><input type="hidden" name="status" value={project.status === "published" ? "draft" : "published"}/><button className="btn-secondary" type="submit">{project.status === "published" ? "Unpublish" : "Publish"}</button></form><form action={deleteProject}><input type="hidden" name="id" value={project.id}/><button className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10" type="submit">Delete</button></form></div></article>)}</div>}
  </div></main>;
}
