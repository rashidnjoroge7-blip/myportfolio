// src/app/admin/quotes/[id]/page.tsx
import { convertQuoteToProject } from "./convertToProject";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { updateQuoteStatus } from "./actions";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: quote } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  return (
    <main className="min-h-screen px-6 py-12 bg-[var(--bg)]">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin/quotes"
              className="text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            >
              ← Back to Quotations
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">
              Quotation Details
            </h1>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-[var(--surface)] border border-[var(--card-border)] text-[var(--muted)]">
            {quote.status}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Client Details */}
          <div className="md:col-span-2 space-y-6">
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
                Client Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[var(--muted)]">Name</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {quote.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Email</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {quote.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Project Type</dt>
                  <dd className="font-medium text-[var(--text)] capitalize">
                    {quote.project_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--muted)]">Budget</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {quote.budget}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[var(--muted)]">Timeline</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {quote.timeline || "Not specified"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
                Requirements
              </h2>
              <div className="text-sm text-[var(--text)] whitespace-pre-wrap">
                {quote.features || "No specific features listed."}
              </div>
              {quote.message && (
                <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                  <dt className="text-[var(--muted)] text-sm mb-1">
                    Additional Message
                  </dt>
                  <dd className="text-sm text-[var(--text)] whitespace-pre-wrap">
                    {quote.message}
                  </dd>
                </div>
              )}
            </section>
          </div>

          {/* Right: Actions */}
          <div className="md:col-span-1">
            {quote.status === "accepted" && (
              <form
                action={convertQuoteToProject}
                className="rounded-2xl border border-[var(--accent)] bg-[var(--surface)] p-6 space-y-4 mb-6"
              >
                <input type="hidden" name="quoteId" value={quote.id} />
                <div>
                  <label
                    htmlFor="projectTitle"
                    className="block text-sm font-medium text-[var(--text)] mb-1"
                  >
                    Project Title
                  </label>
                  <input
                    type="text"
                    name="projectTitle"
                    id="projectTitle"
                    required
                    defaultValue={`${quote.name} - ${quote.project_type}`}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-2)] transition-colors"
                >
                  Convert to Client Project & Send Magic Link
                </button>
                <p className="text-xs text-[var(--muted)] text-center">
                  *Creates a client project and emails a magic link to{" "}
                  {quote.email}
                </p>
              </form>
            )}
            <form
              action={updateQuoteStatus}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6 space-y-4 sticky top-6"
            >
              <input type="hidden" name="id" value={quote.id} />

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-[var(--text)] mb-1"
                >
                  Update Status
                </label>
                <select
                  name="status"
                  id="status"
                  defaultValue={quote.status}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="adminNotes"
                  className="block text-sm font-medium text-[var(--text)] mb-1"
                >
                  Internal Notes
                </label>
                <textarea
                  name="adminNotes"
                  id="adminNotes"
                  rows={4}
                  defaultValue={quote.admin_notes || ""}
                  placeholder="Add private notes here..."
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-2)] transition-colors"
              >
                Save & Notify Client
              </button>
              <p className="text-xs text-[var(--muted)] text-center">
                *Accept/Reject triggers an email to the client.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
