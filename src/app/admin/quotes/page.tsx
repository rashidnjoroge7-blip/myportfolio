import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type QuoteRequest = {
  id: string;
  name: string;
  email: string;
  project_type: string;
  budget_range: string;
  status: "pending" | "reviewing" | "quoted" | "completed" | "cancelled";
  created_at: string;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    reviewing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    quoted: "bg-green-500/10 text-green-400 border-green-500/20",
    completed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const style = styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const { status } = await searchParams;

  let query = supabase
    .from("quote_requests")
    .select("id, name, email, project_type, budget_range, status, created_at")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: quotes } = (await query) as { data: QuoteRequest[] | null };
  const statuses = ["all", "pending", "reviewing", "quoted", "completed", "cancelled"];

  return (
    <main className="min-h-screen px-6 py-12 bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest !text-white">
              Portfolio CMS
            </p>
            <h1 className="mt-2 text-4xl font-bold !text-white">
              Quotation Requests
            </h1>
          </div>
          <Link href="/admin" className="btn-secondary">
            &#8592; Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map((s) => {
            const isActive = status === s || (s === "all" && !status);
            return (
              <Link
                key={s}
                href={`/admin/quotes${s === "all" ? "" : `?status=${s}`}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  isActive
                    ? "bg-[var(--accent)] !text-white border-[var(--accent)]"
                    : "bg-slate-800 !text-white border-slate-600 hover:bg-slate-700 hover:border-amber-400 hover:text-white"
                }`}
                style={{ color: '#ffffff' }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="bg-slate-800 !text-white uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Project Type</th>
                  <th className="px-6 py-4 font-semibold">Budget Range</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="min-w-[150px] whitespace-nowrap px-6 py-4 font-semibold" style={{ color: "#ffffff" }}>Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {quotes && quotes.length > 0 ? (
                  quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                      <td className="px-6 py-4 font-medium !text-white whitespace-nowrap">
                        {quote.name}
                      </td>
                      <td className="px-6 py-4 text-white whitespace-nowrap">
                        {quote.email}
                      </td>
                      <td className="px-6 py-4 !text-white capitalize">
                        {quote.project_type}
                      </td>
                      <td className="px-6 py-4 !text-white">
                        {quote.budget_range}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="min-w-[150px] whitespace-nowrap px-6 py-4 font-bold" style={{ color: "#ffffff" }}>
                        {new Date(quote.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/quotes/${quote.id}`}
                          className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center !text-white">
                      No quotation requests found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}






