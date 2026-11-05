import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { updateQuoteStatus } from "./actions";

export const dynamic = "force-dynamic";

const statuses = [
  "pending",
  "reviewing",
  "quoted",
  "completed",
  "cancelled",
];

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();

  const params = await searchParams;

  const selectedStatus = statuses.includes(params.status ?? "")
    ? params.status!
    : "";

  const search = (params.search ?? "")
    .replace(/[^a-zA-Z0-9\s@._-]/g, "")
    .trim()
    .slice(0, 100);

  const supabase = getSupabaseAdmin();

  const { data: allQuotes, error: statsError } = await supabase
    .from("quote_requests")
    .select("id,status");

  let query = supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (selectedStatus) {
    query = query.eq("status", selectedStatus);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,project_name.ilike.%${search}%`
    );
  }

  const { data: quotes, error } = await query;

  const records = allQuotes ?? [];
  const requests = quotes ?? [];

  const stats = [
    {
      label: "Total requests",
      value: records.length,
    },
    {
      label: "Pending",
      value: records.filter((q) => q.status === "pending").length,
    },
    {
      label: "Reviewing",
      value: records.filter((q) => q.status === "reviewing").length,
    },
    {
      label: "Quoted",
      value: records.filter((q) => q.status === "quoted").length,
    },
    {
      label: "Completed",
      value: records.filter((q) => q.status === "completed").length,
    },
  ];

  const statusStyle: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    reviewing: "bg-blue-500/10 text-blue-600",
    quoted: "bg-purple-500/10 text-purple-600",
    completed: "bg-green-500/10 text-green-600",
    cancelled: "bg-red-500/10 text-red-600",
  };

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-[var(--accent-2)] hover:underline"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-3 text-4xl font-bold">
              Quote Requests
            </h1>

            <p className="mt-2 text-[var(--muted)]">
              Manage client enquiries and quotation requests.
            </p>
          </div>

          <Link href="/admin/projects" className="btn-secondary">
            Manage projects
          </Link>
        </div>

        {params.deleted && (
          <p className="mt-6 rounded-xl border border-green-500/40 p-3 text-sm">
            Quotation deleted successfully.
          </p>
        )}

        {params.error && (
          <p className="mt-6 rounded-xl border border-red-500/40 p-3 text-sm">
            The requested action could not be completed.
          </p>
        )}

        {statsError && (
          <p className="mt-6 rounded-xl border border-red-500/40 p-3 text-sm">
            Could not load quotation statistics.
          </p>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5"
            >
              <p className="text-sm text-[var(--muted)]">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-bold">
                {statsError ? "—" : stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5">

          <form
            action="/admin/quotes"
            method="GET"
            className="flex flex-wrap gap-3"
          >
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search client or project..."
              className="min-w-0 flex-1 rounded-xl border border-[var(--card-border)] bg-transparent px-4 py-3"
            />

            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3"
            >
              <option value="">All statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <button type="submit" className="btn-primary">
              Search
            </button>

            <Link href="/admin/quotes" className="btn-secondary">
              Reset
            </Link>
          </form>

          {error ? (
            <p className="mt-8 rounded-xl border border-red-500/40 p-5">
              Could not load quotation requests. Check your Supabase
              configuration and quote_requests table.
            </p>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="text-xl font-semibold">
                No quotation requests found
              </h2>

              <p className="mt-2 text-[var(--muted)]">
                New client submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                    <th className="px-3 py-4">Client</th>
                    <th className="px-3 py-4">Project</th>
                    <th className="px-3 py-4">Budget</th>
                    <th className="px-3 py-4">Date</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-b border-[var(--card-border)] last:border-0"
                    >
                      <td className="px-3 py-5">
                        <p className="font-semibold">{quote.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {quote.email}
                        </p>
                      </td>

                      <td className="px-3 py-5">
                        {quote.project_name || quote.project_type}
                      </td>

                      <td className="px-3 py-5">
                        {quote.budget_range}
                      </td>

                      <td className="px-3 py-5">
                        {new Date(quote.created_at).toLocaleDateString("en-KE")}
                      </td>

                      <td className="px-3 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyle[quote.status] ??
                            "bg-gray-500/10 text-gray-600"
                          }`}
                        >
                          {quote.status}
                        </span>
                      </td>

                      <td className="px-3 py-5">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/quotes/${quote.id}`}
                            className="btn-secondary"
                          >
                            View
                          </Link>

                          {quote.status === "pending" && (
                            <form action={updateQuoteStatus}>
                              <input
                                type="hidden"
                                name="id"
                                value={quote.id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value="reviewing"
                              />

                              <button
                                type="submit"
                                className="rounded-xl border border-blue-500/40 px-3 py-2 text-xs text-blue-600"
                              >
                                Review
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
