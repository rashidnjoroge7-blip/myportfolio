import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import ProjectForm from "../../project-form";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  return <main className="min-h-screen px-6 py-12"><div className="mx-auto max-w-4xl"><Link href="/admin/projects" className="text-sm text-[var(--accent-2)] hover:underline">← Projects</Link><h1 className="mt-3 text-4xl font-bold">Add a project</h1><p className="mb-8 mt-2 text-[var(--muted)]">Fill in the details and choose whether to publish immediately.</p>{params.error && <p role="alert" className="mb-6 rounded-xl border border-red-500/40 p-3 text-sm">Please check all fields, ensure URLs use HTTPS, and verify the slug is unique.</p>}<ProjectForm /></div></main>;
}
