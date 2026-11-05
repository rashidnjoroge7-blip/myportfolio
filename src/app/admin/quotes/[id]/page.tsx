import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { updateQuoteStatus, deleteQuote, sendQuoteProposal } from "../actions";
import DeleteQuoteButton from "../delete-quote-button";

export const dynamic = "force-dynamic";

type QuoteStatus =
  | "pending"
  | "reviewing"
  | "quoted"
  | "completed"
  | "cancelled";

type Quote = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  project_name: string | null;
  project_type: string;
  project_description: string;
  features: string | null;
  budget_range: string;
  timeline: string;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
  quote_amount: number | null;
  quote_currency: string | null;
  quote_valid_until: string | null;
  quote_notes: string | null;
  quote_sent_at: string | null;
  client_response: "accepted" | "revision_requested" | null;
  client_response_at: string | null;
  revision_notes: string | null;
};

const statuses: { value: QuoteStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Under Review" },
  { value: "quoted", label: "Quotation Prepared" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClasses(status: QuoteStatus) {
  const styles: Record<QuoteStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    reviewing: "bg-blue-100 text-blue-800",
    quoted: "bg-violet-100 text-violet-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return styles[status];
}

export default async function QuoteDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    updated?: string;
    email?: string;
    error?: string;
    quoteSent?: string;
    quoteError?: string;
  }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const query = await searchParams;

  const { data, error } = await getSupabaseAdmin()
    .from("quote_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("QUOTE DETAILS FETCH ERROR:", error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  const quote = data as Quote;
  const phoneDigits = (quote.phone || "").replace(/\D/g, "");

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quotation Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review client information and manage this quotation request.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/admin/quotes/${quote.id}/pdf`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Download PDF
          </a>

          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses(
              quote.status,
            )}`}
          >
            {statuses.find((item) => item.value === quote.status)?.label ||
              quote.status}
          </span>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {query.updated === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">
            Quotation status updated successfully.
          </p>

          {query.email === "sent" && (
            <p className="mt-1">The client notification email was sent.</p>
          )}

          {query.email === "failed" && (
            <p className="mt-1">
              The status was saved, but the client email could not be sent.
              Check the SMTP configuration and server logs.
            </p>
          )}

          {query.email === "unchanged" && (
            <p className="mt-1">
              No email was needed because the status did not change.
            </p>
          )}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {query.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {query.error === "update"
            ? "Could not update the quotation status."
            : query.error === "delete"
              ? "Could not delete this quotation."
              : "There was a problem processing the request."}
        </div>
      )}

      {/* QUOTATION EMAIL SUCCESS */}
      {query.quoteSent === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Quotation emailed successfully and status changed to Quoted.
        </div>
      )}

      {/* QUOTATION EMAIL ERROR */}
      {query.quoteError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {query.quoteError === "email"
            ? "Quotation details were saved, but the email could not be sent. Check SMTP settings and try again."
            : query.quoteError === "save-status"
              ? "The email was sent, but the quotation status could not be updated. Check Supabase before retrying."
              : query.quoteError === "save"
                ? "Could not save the quotation details."
                : "Invalid quotation information or quotation request not found."}
        </div>
      )}

      {/* CLIENT AND PROJECT INFORMATION */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CLIENT INFORMATION */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Client Information</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{quote.name}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>
                <a
                  href={`mailto:${quote.email}`}
                  className="break-all text-blue-600 hover:underline"
                >
                  {quote.email}
                </a>
              </dd>
            </div>

            {quote.company && (
              <div>
                <dt className="text-gray-500">Company</dt>
                <dd className="font-medium text-gray-900">{quote.company}</dd>
              </div>
            )}

            {quote.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">{quote.phone}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`mailto:${quote.email}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Email Client
            </a>

            {phoneDigits && (
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* PROJECT INFORMATION */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Project Information</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Project name</dt>
              <dd className="font-medium text-gray-900">
                {quote.project_name || "Not provided"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Project type</dt>
              <dd className="font-medium text-gray-900">
                {quote.project_type}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Budget</dt>
              <dd className="font-medium text-gray-900">
                {quote.budget_range}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Timeline</dt>
              <dd className="font-medium text-gray-900">{quote.timeline}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* PROJECT DESCRIPTION */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Project Description</h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
          {quote.project_description}
        </p>

        {quote.features && (
          <div className="mt-6">
            <h3 className="font-semibold">Requested Features</h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {quote.features}
            </p>
          </div>
        )}
      </section>

      {/* CLIENT RESPONSE */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Client Response</h2>

          {quote.client_response === "accepted" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              Accepted
            </span>
          ) : quote.client_response === "revision_requested" ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              Revision Requested
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              Awaiting Response
            </span>
          )}
        </div>

        {!quote.client_response && (
          <p className="mt-3 text-sm text-gray-600">
            The quotation has not yet received a response from the client.
          </p>
        )}

        {quote.client_response === "accepted" && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="font-semibold text-emerald-800">
              Quotation Accepted
            </h3>

            <p className="mt-2 text-sm text-emerald-700">
              The client has accepted this quotation.
            </p>

            {quote.client_response_at && (
              <p className="mt-2 text-xs text-emerald-700">
                Response received: {formatDate(quote.client_response_at)}
              </p>
            )}
          </div>
        )}

        {quote.client_response === "revision_requested" && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-800">
              Client Requested a Revision
            </h3>

            {quote.client_response_at && (
              <p className="mt-2 text-xs text-amber-700">
                Response received: {formatDate(quote.client_response_at)}
              </p>
            )}

            <div className="mt-4">
              <p className="text-sm font-semibold text-amber-800">
                Client&apos;s Revision Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-amber-900">
                {quote.revision_notes || "No additional details provided."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* PREPARE AND SEND QUOTATION */}
      <section className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Prepare & Send Quotation</h2>

        <p className="mt-1 text-sm text-gray-500">
          Prepare a price proposal and email it directly to the client.
        </p>

        {quote.quote_sent_at && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            Last quotation sent: {formatDate(quote.quote_sent_at)}
          </div>
        )}

        <form action={sendQuoteProposal} className="mt-6 space-y-5">
          <input type="hidden" name="id" value={quote.id} />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="quote_amount"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Quotation Amount (KES)
              </label>

              <input
                id="quote_amount"
                name="quote_amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={quote.quote_amount ?? ""}
                placeholder="e.g. 85000"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="quote_valid_until"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Valid Until
              </label>

              <input
                id="quote_valid_until"
                name="quote_valid_until"
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                defaultValue={quote.quote_valid_until ?? ""}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="quote_notes"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Proposal Details
            </label>

            <textarea
              id="quote_notes"
              name="quote_notes"
              rows={6}
              maxLength={5000}
              defaultValue={quote.quote_notes ?? ""}
              placeholder="Describe the services, deliverables, payment terms and other important details..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Send Quotation to Client →
          </button>
        </form>
      </section>

      {/* UPDATE QUOTATION STATUS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Update Quotation Status</h2>

        <p className="mt-1 text-sm text-gray-500">
          Changing the status will send an email notification to the client.
        </p>

        <form action={updateQuoteStatus} className="mt-4 flex flex-wrap gap-3">
          <input type="hidden" name="id" value={quote.id} />

          <select
            name="status"
            defaultValue={quote.status}
            className="min-w-52 rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Save Status
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-500">
          Last updated: {formatDate(quote.updated_at)}
        </p>
      </section>

      {/* DANGER ZONE */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">Danger Zone</h2>

        <p className="mt-1 text-sm text-red-700">
          Permanently delete this quotation request.
        </p>

        <div className="mt-4">
          <DeleteQuoteButton id={quote.id} action={deleteQuote} />
        </div>
      </section>
    </main>
  );
}
