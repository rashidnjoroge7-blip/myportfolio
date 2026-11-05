import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { respondToQuote } from "./actions";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuotePortal({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ response?: string; error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  if (!UUID_REGEX.test(token)) notFound();

  const supabase = getSupabaseAdmin();

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .select(`
      id,
      name,
      email,
      project_name,
      project_type,
      project_description,
      quote_amount,
      quote_currency,
      quote_valid_until,
      quote_notes,
      quote_sent_at,
      client_response,
      client_response_at,
      revision_notes,
      status
    `)
    .eq("quote_token", token)
    .maybeSingle();

  if (error || !quote) notFound();

  if (quote.status !== "quoted" && !quote.client_response) {
    notFound();
  }

  const currency = quote.quote_currency || "KES";

  const amount = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(quote.quote_amount || 0));

  const alreadyResponded = Boolean(quote.client_response);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
            Project quotation
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Your quotation is ready
          </h1>
          <p className="mt-3 text-slate-400">
            Review your proposal and submit your response below.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8">
          <h2 className="text-xl font-semibold">
            Hello {quote.name},
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Project</p>
              <p className="mt-1 font-medium">
                {quote.project_name || "Website project"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Project type</p>
              <p className="mt-1 font-medium">
                {quote.project_type || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Quotation amount</p>
              <p className="mt-1 text-2xl font-bold text-sky-400">
                {amount}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Valid until</p>
              <p className="mt-1 font-medium">
                {quote.quote_valid_until
                  ? new Date(quote.quote_valid_until).toLocaleDateString("en-KE")
                  : "Not specified"}
              </p>
            </div>
          </div>

          {quote.project_description && (
            <div className="mt-7 border-t border-slate-700 pt-6">
              <h3 className="font-semibold">Project requirements</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {quote.project_description}
              </p>
            </div>
          )}

          {quote.quote_notes && (
            <div className="mt-7 rounded-xl bg-slate-800 p-5">
              <h3 className="font-semibold">Proposal details</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {quote.quote_notes}
              </p>
            </div>
          )}

          {query.error && (
            <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {query.error === "notes-required"
                ? "Please provide notes explaining your requested revision."
                : query.error === "already-responded"
                  ? "This quotation has already received a response."
                  : "We could not process your response. Please try again."}
            </div>
          )}

          {alreadyResponded ? (
            <div className="mt-8 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <h3 className="font-semibold text-emerald-400">
                Response submitted
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {quote.client_response === "accepted"
                  ? "You have accepted this quotation."
                  : "You have requested a revision to this quotation."}
              </p>

              {quote.revision_notes && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                  {quote.revision_notes}
                </p>
              )}
            </div>
          ) : (
            <form action={respondToQuote} className="mt-8 space-y-5">
              <input type="hidden" name="token" value={token} />

              <div>
                <label
                  htmlFor="revision_notes"
                  className="mb-2 block text-sm font-medium"
                >
                  Revision notes (required if requesting changes)
                </label>
                <textarea
                  id="revision_notes"
                  name="revision_notes"
                  rows={4}
                  maxLength={2000}
                  placeholder="Tell us what you would like changed..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  name="response"
                  value="accepted"
                  className="flex-1 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-600"
                >
                  Accept quotation
                </button>

                <button
                  type="submit"
                  name="response"
                  value="revision_requested"
                  className="flex-1 rounded-xl border border-slate-600 px-5 py-3 font-semibold transition hover:bg-slate-800"
                >
                  Request revision
                </button>
              </div>
            </form>
          )}
        </section>

        <footer className="mt-8 text-center text-sm text-slate-500">
          Professional Website Design & Development
        </footer>
      </div>
    </main>
  );
}
