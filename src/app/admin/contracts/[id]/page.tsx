import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type JsonRecord = Record<string, unknown>;

function getString(record: JsonRecord | null | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function getValue(record: JsonRecord | null | undefined, key: string) {
  const value = record?.[key];
  return value === null || value === undefined || value === "" ? "Not provided" : String(value);
}

export default async function AdminContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = getSupabaseAdmin();
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("id, contract_number, status, current_version_id, client_id, client_project_id, quote_request_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !contract) notFound();

  const [clientResult, projectResult, quoteResult, versionResult, versionsResult, signaturesResult, eventsResult] = await Promise.all([
    supabase.from("clients").select("id, full_name, email, company_name, phone").eq("id", contract.client_id).maybeSingle(),
    supabase.from("client_projects").select("id, title, status, created_at").eq("id", contract.client_project_id).maybeSingle(),
    supabase.from("quote_requests").select("id, name, email, project_type, project_description, features, timeline, budget_range, quote_amount, quote_currency, quote_valid_until, quote_notes, client_response, client_response_at").eq("id", contract.quote_request_id).maybeSingle(),
    contract.current_version_id
      ? supabase.from("contract_versions").select("id, version_number, title, scope_snapshot, quote_snapshot, terms_text, total_amount, currency, deposit_percent, balance_percent, document_path, document_sha256, issued_at, expires_at, created_at").eq("id", contract.current_version_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("contract_versions").select("id, version_number, title, created_at, document_sha256").eq("contract_id", id).order("version_number", { ascending: false }),
    supabase.from("contract_signatures").select("id, version_id, signer_role, signer_name, signature_method, consent_text, document_sha256, signed_at").eq("contract_id", id).order("signed_at", { ascending: false }),
    supabase.from("contract_events").select("id, event_type, actor_role, client_visible, details, created_at").eq("contract_id", id).order("created_at", { ascending: false }),
  ]);

  if (clientResult.error || projectResult.error || quoteResult.error || versionResult.error) {
    console.error("Unable to load related contract records.", {
      client: clientResult.error?.message,
      project: projectResult.error?.message,
      quote: quoteResult.error?.message,
      version: versionResult.error?.message,
    });
  }

  const client = clientResult.data;
  const project = projectResult.data;
  const quote = quoteResult.data;
  const version = versionResult.data as (JsonRecord & {
    id: string; version_number: number; title: string; scope_snapshot: JsonRecord;
    quote_snapshot: JsonRecord; terms_text: string; total_amount: number | string;
    currency: string; deposit_percent: number | string; balance_percent: number | string;
    created_at: string; document_sha256: string | null;
  }) | null;
  const scope = version?.scope_snapshot ?? {};
  const quoteSnapshot = version?.quote_snapshot ?? {};
  const signatures = signaturesResult.data ?? [];
  const events = eventsResult.data ?? [];
  const versions = versionsResult.data ?? [];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/admin/contracts" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">← Back to contracts</Link>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Internal draft workspace</p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">{contract.contract_number}</h1>
              <p className="mt-1 text-sm capitalize text-[var(--muted)]">{contract.status.replaceAll("_", " ")}</p>
            </div>
            <Link href={`/admin/quotes/${contract.quote_request_id}`} className="w-fit rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:border-[var(--accent)]">View originating quotation</Link>
          </div>
        </div>

        {created === "1" && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">Internal contract draft created. It has not been sent or signed.</div>
        )}
        {created === "0" && (
          <div role="status" className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-4 text-sm font-medium text-blue-700 dark:text-blue-300">An existing contract draft was found for this quotation; no duplicate was created.</div>
        )}

        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>Not for client distribution.</strong> This is an internal draft. The contract wording, governing law, payment schedule and signature method still require appropriate legal review and administrator approval. There are no send or sign actions in this stage.
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)]">Client and project</h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-[var(--muted)]">Client</dt><dd className="mt-1 font-medium text-[var(--text)]">{client?.full_name || client?.email || "Client record unavailable"}</dd></div>
                <div><dt className="text-[var(--muted)]">Email</dt><dd className="mt-1 font-medium text-[var(--text)]">{client?.email || "Not provided"}</dd></div>
                <div><dt className="text-[var(--muted)]">Company</dt><dd className="mt-1 font-medium text-[var(--text)]">{client?.company_name || "Not provided"}</dd></div>
                <div><dt className="text-[var(--muted)]">Phone</dt><dd className="mt-1 font-medium text-[var(--text)]">{client?.phone || "Not provided"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-[var(--muted)]">Project</dt><dd className="mt-1 font-medium text-[var(--text)]">{project?.title || "Project record unavailable"}</dd><dd className="mt-1 text-xs capitalize text-[var(--muted)]">Project status: {project?.status || "Unknown"}</dd></div>
              </dl>
            </section>

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--text)]">Version {version?.version_number ?? "unavailable"} · {version?.title || "Untitled draft"}</h2>
                <span className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs text-[var(--muted)]">Current version</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-[var(--muted)]">Quotation amount</p><p className="mt-1 text-xl font-bold text-[var(--text)]">{version ? new Intl.NumberFormat("en-KE", { style: "currency", currency: version.currency }).format(Number(version.total_amount)) : "Unavailable"}</p></div>
                <div><p className="text-xs text-[var(--muted)]">Draft payment split</p><p className="mt-1 font-semibold text-[var(--text)]">{version ? `${version.deposit_percent}% deposit / ${version.balance_percent}% balance` : "Unavailable"}</p><p className="mt-1 text-xs text-[var(--muted)]">Proposed default only; must be confirmed before review.</p></div>
              </div>
              <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                <h3 className="text-sm font-semibold text-[var(--text)]">Scope snapshot</h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-[var(--muted)]">Project type</dt><dd className="mt-1 text-[var(--text)]">{getValue(scope, "project_type")}</dd></div>
                  <div><dt className="text-[var(--muted)]">Timeline</dt><dd className="mt-1 text-[var(--text)]">{getValue(scope, "timeline")}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-[var(--muted)]">Description</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-[var(--text)]">{getValue(scope, "project_description")}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-[var(--muted)]">Features</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-[var(--text)]">{getValue(scope, "features")}</dd></div>
                </dl>
              </div>
              <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                <h3 className="text-sm font-semibold text-[var(--text)]">Internal draft terms</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[var(--bg)] p-4 text-sm leading-6 text-[var(--muted)]">{version?.terms_text || "No terms snapshot is available."}</p>
              </div>
              <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                <h3 className="text-sm font-semibold text-[var(--text)]">Source quotation snapshot</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">Quote amount: {getValue(quoteSnapshot, "quote_amount")} {getString(quoteSnapshot, "quote_currency")}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Valid until: {getValue(quoteSnapshot, "quote_valid_until")}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">{getValue(quoteSnapshot, "quote_notes")}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)]">Version history</h2>
              <div className="mt-4 space-y-3">
                {versions.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--bg)] p-3 text-sm">
                    <div><p className="font-medium text-[var(--text)]">Version {item.version_number}: {item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{new Date(item.created_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</p></div>
                    <span className="text-xs text-[var(--muted)]">{item.document_sha256 ? "Document hash recorded" : "No signed document hash"}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5">
              <h2 className="font-semibold text-[var(--text)]">Execution status</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-[var(--muted)]">Client signatures</dt><dd className="font-medium text-[var(--text)]">{signatures.filter(s => s.signer_role === "client").length}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--muted)]">UniHost signatures</dt><dd className="font-medium text-[var(--text)]">{signatures.filter(s => s.signer_role === "unihost").length}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[var(--muted)]">Audit events</dt><dd className="font-medium text-[var(--text)]">{events.length}</dd></div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-[var(--muted)]">No execution action is available yet. Signing will be introduced only after the contract template and approved legal/signature process are confirmed.</p>
            </section>

            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5">
              <h2 className="font-semibold text-[var(--text)]">Audit trail</h2>
              <div className="mt-4 space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-l-2 border-[var(--accent)] pl-3">
                    <p className="text-sm font-medium capitalize text-[var(--text)]">{event.event_type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{event.actor_role || "System"} · {new Date(event.created_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
