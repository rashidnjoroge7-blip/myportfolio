import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { PortfolioProject } from "@/lib/projectSchema";
import ProjectForm from "../../project-form";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { data, error } = await getSupabaseAdmin().from("projects").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  return <main className="min-h-screen px-6 py-12"><div className="mx-auto max-w-4xl"><Link href="/admin/projects" className="text-sm text-[var(--accent-2)] hover:underline">← Projects</Link><h1 className="mt-3 text-4xl font-bold">Edit project</h1><p className="mb-8 mt-2 text-[var(--muted)]">Update project details and publication status.</p>{query.error && <p role="alert" className="mb-6 rounded-xl border border-red-500/40 p-3 text-sm">Could not save changes. Check the details and ensure the slug is unique.</p>}<ProjectForm project={data as PortfolioProject} /></div></main>;
}
