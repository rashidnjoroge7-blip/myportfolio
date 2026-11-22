// src/app/admin/quotes/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { updateQuoteStatus } from "./actions";
import { sendQuoteProposal } from "../actions";
import { convertQuoteToProject, resendClientAccessLink } from "./convertToProject";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    quoteSent?: string;
    quoteError?: string;
    updated?: string;
    email?: string;
    conversion?: string;
    accessLink?: string;
  }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const { success, quoteSent, quoteError, updated, email, conversion, accessLink } = await searchParams;

  const supabase = getSupabaseAdmin();

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) {
    notFound();
  }

  const {
    data: existingProject,
    error: existingProjectError,
  } = await supabase
    .from("client_projects")
    .select("id, title, status, created_at")
    .eq("quote_request_id", quote.id)
    .maybeSingle();

  if (existingProjectError) {
    console.error("Unable to check existing client project:", existingProjectError);
  }

  const canConvertQuote =
    quote.status === "quoted" &&
    quote.client_response === "accepted" &&
    !existingProject &&
    !existingProjectError;

  const canResendAccessLink =
    quote.status === "completed" &&
    quote.client_response === "accepted" &&
    Boolean(existingProject);

  const hasQuotationAmount =
    quote.quote_amount !== null &&
    quote.quote_amount !== undefined &&
    Number(quote.quote_amount) > 0;

  const currency = quote.quote_currency || "KES";

  const formattedAmount = hasQuotationAmount
    ? new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(Number(quote.quote_amount))
    : null;
  const isEstimatorSubmission = quote.submission_source === "project_estimator";

  const estimatorDetails = quote.estimator_details as {
    category?: string;
    size?: string;
    design?: string;
    features?: string[];
    services?: string[];
  } | null;

  const estimateCurrency = quote.estimate_currency || "KES";

  const formatEstimate = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: estimateCurrency,
      maximumFractionDigits: 0,
    }).format(amount);

  const estimateRange =
    quote.estimate_min != null && quote.estimate_max != null
      ? `${formatEstimate(Number(quote.estimate_min))} – ${formatEstimate(Number(quote.estimate_max))}`
      : "Estimate unavailable";

  const categoryLabels: Record<string, string> = {
    landing: "Landing Page",
    business: "Business Website",
    corporate: "Corporate Website",
    ecommerce: "E-commerce Website",
    webapp: "Custom Web Application",
  };

  const sizeLabels: Record<string, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    enterprise: "Enterprise",
  };

  const designLabels: Record<string, string> = {
    standard: "Standard",
    custom: "Custom",
    premium: "Premium",
  };

  const featureLabels: Record<string, string> = {
    booking: "Booking System",
    payments: "Online Payments",
    accounts: "User Accounts",
    dashboard: "Admin Dashboard",
    integrations: "Third-party Integrations",
    cms: "Content Management System",
    seo: "SEO Setup",
  };

  const serviceLabels: Record<string, string> = {
    hosting: "Hosting",
    maintenance: "Maintenance",
  };
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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

            <p className="mt-1 text-sm text-[var(--muted)]">
              Manage the client request, prepare proposals and track progress.
            </p>
          </div>

          <span className="w-fit rounded-full border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium capitalize text-[var(--muted)]">
            {quote.status}
          </span>
        </div>

        {/* Notifications */}
        {success === "updated" && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            ✓ Quotation status updated successfully.
          </div>
        )}

        {quoteSent === "1" && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            ✓ Quotation successfully prepared and emailed to the client.
          </div>
        )}

        {updated === "1" && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            ✓ Quotation updated. Email status: {email || "unchanged"}.
          </div>
        )}

        {quoteError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400"
          >
            Unable to prepare quotation.
            <span className="ml-1">
              {quoteError === "invalid" &&
                "Check the quotation amount and validity date."}
              {quoteError === "not-found" && "Quotation record was not found."}
              {quoteError === "missing-token" &&
                "This quotation has no secure client token."}
              {quoteError === "save" && "Unable to save quotation details."}
              {quoteError === "email" &&
                "Quotation was saved, but email delivery failed."}
              {quoteError === "save-status" &&
                "Email was sent, but status could not be updated."}
              {quoteError === "project-exists" &&
                "This quotation is already linked to a client project. A revised proposal cannot reset its acceptance."}
            </span>
          </div>
        )}

        {conversion === "success" && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Client project created successfully. A client access link has been sent.
          </div>
        )}

        {conversion === "email-failed" && (
          <div role="alert" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm font-medium text-amber-700 dark:text-amber-400">
            The project was created, but the client access email could not be sent. Use the resend access link option below.
          </div>
        )}

        {conversion === "failed" && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            Project conversion failed. Check the project record and server logs before trying again.
          </div>
        )}

        {conversion === "configuration-error" && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            Client access configuration is incomplete. Check the application URL configuration.
          </div>
        )}

        {accessLink === "sent" && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            A new client access link has been sent successfully.
          </div>
        )}

        {accessLink === "failed" && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            Unable to send the client access link. Check the server logs.
          </div>
        )}

        {accessLink === "configuration-error" && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            Client access configuration is incomplete. Check the application URL configuration.
          </div>
        )}
        {accessLink === "not-eligible" && (
          <div role="alert" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm font-medium text-amber-700 dark:text-amber-400">
            This quotation is not eligible for a client access-link resend. Verify that it has been accepted, converted, and linked to a client project.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 md:col-span-2">
            {/* Client Information */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="mb-5 text-lg font-semibold text-[var(--text)]">
                Client Information
              </h2>

              <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--muted)]">Client Name</dt>
                  <dd className="mt-1 font-medium text-[var(--text)]">
                    {quote.name}
                  </dd>
                </div>

                <div>
                  <dt className="text-[var(--muted)]">Email Address</dt>
                  <dd className="mt-1 font-medium text-[var(--text)]">
                    {quote.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-[var(--muted)]">Company</dt>
                  <dd className="mt-1 font-medium text-[var(--text)]">
                    {quote.company || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-[var(--muted)]">Phone</dt>
                  <dd className="mt-1 font-medium text-[var(--text)]">
                    {quote.phone || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-[var(--muted)]">Project Type</dt>
                  <dd className="mt-1 font-medium capitalize text-[var(--text)]">
                    {quote.project_type}
                  </dd>
                </div>

                <div>
                  <dt className="text-[var(--muted)]">Budget Range</dt>
                  <dd className="mt-1 font-medium text-[var(--text)]">
                    {quote.budget_range || "Not specified"}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-[var(--muted)]">Timeline</dt>
                  <dd className="mt-1 font-medium text-[var(--text)]">
                    {quote.timeline || "Not specified"}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Project Requirements */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="mb-5 text-lg font-semibold text-[var(--text)]">
                Project Requirements
              </h2>

              <div className="text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
                {quote.project_description || "No description provided."}
              </div>

              {quote.features && (
                <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                  <h3 className="mb-2 text-sm font-medium text-[var(--muted)]">
                    Requested Features
                  </h3>

                  <div className="text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
                    {quote.features}
                  </div>
                </div>
              )}
            </section>
            {/* Project Estimator Summary */}
            {isEstimatorSubmission && (
              <section className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface)] p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[var(--text)]">
                    Project Estimate
                  </h2>

                  <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    Cost Estimator
                  </span>
                </div>

                <div className="rounded-xl bg-[var(--accent)]/10 p-5">
                  <p className="text-sm text-[var(--muted)]">
                    Indicative Project Budget
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[var(--accent)]">
                    {estimateRange}
                  </p>

                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Preliminary estimate. Final pricing is subject to
                    requirements review and formal quotation.
                  </p>
                </div>

                <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[var(--muted)]">Project Category</dt>
                    <dd className="mt-1 font-semibold text-[var(--text)]">
                      {categoryLabels[estimatorDetails?.category || ""] ||
                        estimatorDetails?.category ||
                        "Not specified"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[var(--muted)]">Project Size</dt>
                    <dd className="mt-1 font-semibold text-[var(--text)]">
                      {sizeLabels[estimatorDetails?.size || ""] ||
                        estimatorDetails?.size ||
                        "Not specified"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[var(--muted)]">Design Level</dt>
                    <dd className="mt-1 font-semibold text-[var(--text)]">
                      {designLabels[estimatorDetails?.design || ""] ||
                        estimatorDetails?.design ||
                        "Not specified"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 border-t border-[var(--card-border)] pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
                    Selected Features
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {estimatorDetails?.features?.length ? (
                      estimatorDetails.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)]"
                        >
                          {featureLabels[feature] || feature}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        No additional features selected.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
                    Additional Services
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {estimatorDetails?.services?.length ? (
                      estimatorDetails.services.map((service) => (
                        <span
                          key={service}
                          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)]"
                        >
                          {serviceLabels[service] || service}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">
                        No additional services selected.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
            {/* Saved Quotation Summary */}
            {hasQuotationAmount && (
              <section className="rounded-2xl border border-emerald-500/30 bg-[var(--surface)] p-6">
                <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">
                  Prepared Quotation
                </h2>

                <div className="rounded-xl bg-emerald-500/10 p-5">
                  <p className="text-sm text-[var(--muted)]">
                    Total Quotation Amount
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formattedAmount}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[var(--muted)]">Valid Until</p>
                    <p className="mt-1 font-medium text-[var(--text)]">
                      {quote.quote_valid_until || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--muted)]">Quotation Status</p>
                    <p className="mt-1 font-medium capitalize text-[var(--text)]">
                      {quote.status}
                    </p>
                  </div>
                </div>

                {quote.quote_notes && (
                  <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                    <h3 className="mb-2 text-sm font-medium text-[var(--muted)]">
                      Proposal Notes
                    </h3>

                    <p className="text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
                      {quote.quote_notes}
                    </p>
                  </div>
                )}

                <a
                  href={`/api/admin/quotes/${encodeURIComponent(quote.id)}/pdf`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-2)]"
                >
                  ↓ Download Quotation PDF
                </a>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 md:col-span-1">
            {/* Prepare and Send Quotation */}
            <form
              action={sendQuoteProposal}
              className="space-y-4 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] p-6"
            >
              <input type="hidden" name="id" value={quote.id} />

              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Prepare Quotation
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Prepare a formal proposal and send it to the client.
                </p>
              </div>

              <div>
                <label
                  htmlFor="quote_amount"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
                >
                  Quotation Amount (KES)
                </label>

                <input
                  type="number"
                  name="quote_amount"
                  id="quote_amount"
                  min="1"
                  step="0.01"
                  required
                  defaultValue={quote.quote_amount ?? ""}
                  placeholder="e.g. 150000"
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label
                  htmlFor="quote_valid_until"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
                >
                  Quotation Valid Until
                </label>

                <input
                  type="date"
                  name="quote_valid_until"
                  id="quote_valid_until"
                  required
                  defaultValue={quote.quote_valid_until ?? ""}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label
                  htmlFor="proposal_notes"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
                >
                  Proposal Notes
                </label>

                <textarea
                  name="quote_notes"
                  id="proposal_notes"
                  rows={5}
                  defaultValue={quote.quote_notes || ""}
                  placeholder="Describe the scope, deliverables, payment terms and other important details..."
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-2)]"
              >
                Prepare & Send Quotation
              </button>

              <p className="text-center text-xs leading-5 text-[var(--muted)]">
                Saves the quotation and emails the client a secure review link.
              </p>
            </form>

            {/* Client Acceptance and Project Tracking */}
            <section className="space-y-4 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Client Acceptance
              </h2>

              {quote.client_response === "accepted" ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ Quotation accepted
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    The client accepted this quotation.
                  </p>
                  {quote.client_response_at && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Response recorded: {new Date(quote.client_response_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
                    </p>
                  )}
                </div>
              ) : quote.client_response === "revision_requested" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    Revision requested
                  </p>
                  {quote.revision_notes && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text)]">
                      {quote.revision_notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] p-4">
                  <p className="font-medium text-[var(--text)]">
                    Awaiting client response
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    The client has not accepted or requested revisions.
                  </p>
                </div>
              )}

              {existingProjectError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  Existing project lookup failed. Conversion is disabled until the project record can be checked.
                </p>
              )}

              {existingProject && (
                <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--bg)] p-4">
                  <h3 className="font-semibold text-[var(--text)]">
                    Existing Client Project
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text)]">
                    {existingProject.title}
                  </p>
                  <p className="mt-1 text-xs capitalize text-[var(--muted)]">
                    Project status: {existingProject.status || "Not specified"}
                  </p>
                  <p className="mt-1 break-all text-xs text-[var(--muted)]">
                    Project ID: {existingProject.id}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    This record is linked to this quotation. It will not be converted again.
                  </p>
                </div>
              )}

              {!existingProject && !existingProjectError && quote.status === "quoted" && quote.client_response !== "accepted" && (
                <p className="text-sm text-[var(--muted)]">
                  Project conversion becomes available after the client accepts the quotation.
                </p>
              )}
            </section>

            {/* Convert to Client Project */}
            {canConvertQuote && (
              <form
                action={convertQuoteToProject}
                className="space-y-4 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] p-6"
              >
                <input type="hidden" name="quoteId" value={quote.id} />

                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Convert Accepted Quotation
                </h2>

                <div>
                  <label
                    htmlFor="projectTitle"
                    className="mb-1 block text-sm font-medium text-[var(--text)]"
                  >
                    Project Title
                  </label>

                  <input
                    type="text"
                    name="projectTitle"
                    id="projectTitle"
                    required
                    maxLength={200}
                    defaultValue={`${quote.name} - ${quote.project_type}`}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-2)]"
                >
                  Create Client Project & Send Access Link
                </button>

                <p className="text-center text-xs leading-5 text-[var(--muted)]">
                  Creates one client project and emails a secure portal access link to{" "}
                  {quote.email}.
                </p>
              </form>
            )}

            {/* Resend Client Access */}
            {canResendAccessLink && (
              <form
                action={resendClientAccessLink}
                className="space-y-4 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6"
              >
                <input type="hidden" name="quoteId" value={quote.id} />

                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Client Portal Access
                </h2>

                <p className="text-sm text-[var(--muted)]">
                  The accepted quotation already has a completed client project. You can resend the secure access link to {quote.email}.
                </p>

                <button
                  type="submit"
                  className="w-full rounded-lg border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                >
                  Resend Client Access Link
                </button>
              </form>
            )}

            {/* Update Quotation Status */}
            <form
              action={updateQuoteStatus}
              className="sticky top-6 space-y-4 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6"
            >
              <input type="hidden" name="id" value={quote.id} />

              <h2 className="text-lg font-semibold text-[var(--text)]">
                Manage Status
              </h2>

              <div>
                <label
                  htmlFor="status"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
                >
                  Quotation Status
                </label>

                <select
                  name="status"
                  id="status"
                  defaultValue={quote.status}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="quoted">Quoted</option>
                  {quote.status === "completed" && <option value="completed" disabled>Completed (managed by project conversion)</option>}
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="adminNotes"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
                >
                  Internal Notes
                </label>

                <textarea
                  name="adminNotes"
                  id="adminNotes"
                  rows={4}
                  defaultValue={quote.internal_notes || ""}
                  placeholder="Add internal notes..."
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-2)]"
              >
                Save & Notify Client
              </button>

              <p className="text-center text-xs leading-5 text-[var(--muted)]">
                Changing the status may trigger a client notification.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
