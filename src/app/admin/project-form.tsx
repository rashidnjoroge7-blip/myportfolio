import Link from "next/link";
import { saveProject } from "./actions";
import ImageUploadField from "./image-upload-field";
import type { PortfolioProject } from "@/lib/projectSchema";

export default function ProjectForm({ project }: { project?: PortfolioProject }) {
  return <form action={saveProject} className="space-y-6">
    {project && <input type="hidden" name="id" value={project.id} />}
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block text-sm font-medium">Project title<input name="title" required minLength={2} maxLength={100} defaultValue={project?.title} className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
      <label className="block text-sm font-medium">URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} defaultValue={project?.slug} placeholder="my-awesome-project" className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
      <label className="block text-sm font-medium md:col-span-2">Short description<textarea name="description" required minLength={10} maxLength={300} rows={3} defaultValue={project?.description} className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
      <label className="block text-sm font-medium md:col-span-2">Case study / full details<textarea name="content" maxLength={10000} rows={5} defaultValue={project?.content} placeholder="What problem did it solve? What did you build?" className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
      <label className="block text-sm font-medium">Technology tags<input name="tags" defaultValue={project?.tags.join(", ")} placeholder="Next.js, Tailwind CSS, Supabase" className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /><span className="mt-1 block text-xs text-[var(--muted)]">Separate tags with commas (up to 12).</span></label>
      <label className="block text-sm font-medium">Category<input name="category" maxLength={60} defaultValue={project?.category ?? "Web Development"} className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
      <ImageUploadField initialValue={project?.image_url} />
      <label className="block text-sm font-medium">Live demo URL<input name="live_url" type="url" defaultValue={project?.live_url} placeholder="https://your-project.vercel.app" className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
      <label className="block text-sm font-medium">Source repository URL<input name="repo_url" type="url" defaultValue={project?.repo_url} placeholder="https://github.com/you/project" className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" /></label>
    </div>
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[var(--card-border)] p-4">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={project?.featured} /> Feature on homepage</label>
      <label className="flex items-center gap-2 text-sm">Publication<select name="status" defaultValue={project?.status ?? "draft"} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label>
    </div>
    <div className="flex gap-3"><button type="submit" className="btn-primary">{project ? "Save changes" : "Create project"}</button><Link href="/admin/projects" className="btn-secondary">Cancel</Link></div>
  </form>;
}
