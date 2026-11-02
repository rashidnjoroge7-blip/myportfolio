import Link from "next/link";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><header className="border-b border-[var(--card-border)] bg-[var(--surface)]"><nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4"><Link href="/admin" className="font-bold">Portfolio <span className="text-[var(--accent)]">Admin</span></Link><div className="flex gap-4 text-sm"><Link href="/admin/projects" className="hover:text-[var(--accent)]">Projects</Link><Link href="/" className="hover:text-[var(--accent)]">View site ↗</Link></div></nav></header>{children}</>;
}
