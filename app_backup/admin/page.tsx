export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <p className="mt-2 text-slate-500">
        Manage your portfolio projects, blog posts, and contact messages.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <a
          href="/admin/projects"
          className="rounded-xl border border-slate-200 p-6 hover:border-sky-500"
        >
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage portfolio projects.
          </p>
        </a>

        <a
          href="/admin/blog"
          className="rounded-xl border border-slate-200 p-6 hover:border-sky-500"
        >
          <h2 className="text-xl font-semibold">Blog Posts</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create and manage articles.
          </p>
        </a>

        <div className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Messages</h2>
          <p className="mt-2 text-sm text-slate-500">
            Review contact form submissions.
          </p>
        </div>
      </div>
    </div>
  );
}
