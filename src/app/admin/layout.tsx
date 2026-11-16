import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-[var(--card-border)] bg-[var(--surface)]">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">

          <Link href="/admin" className="font-bold">
            Portfolio <span className="text-[var(--accent)]">Admin</span>
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin/projects" className="hover:text-[var(--accent)]">
              Projects
            </Link>

            <Link href="/admin/quotes" className="hover:text-[var(--accent)]">
              Quotations
            </Link>

            <Link href="/" className="hover:text-[var(--accent)]">
              View site ↗
            </Link>

            <LogoutButton />
          </div>

        </nav>
      </header>

      {children}
    </>
  );
}
