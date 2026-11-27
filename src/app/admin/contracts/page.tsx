import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ContractRow = {
  id: string;
  contract_number: string;
  status: string;
  created_at: string;
  clients: { full_name: string | null; email: string } | null;
  client_projects: { title: string; status: string | null } | null;
  quote_requests: { project_type: string; quote_amount: number | string | null; quote_currency: string | null } | null;
};

function formatMoney(amount: number | string | null | undefined, currency: string | null | undefined) {
  if (amount === null || amount === undefined) return "Amount unavailable";
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Amount unavailable";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency || "KES",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function AdminContractsPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number, status, created_at, clients(full_name, email), client_projects(title, status), quote_requests(project_type, quote_amount, quote_currency)")
    .order("created_at", { ascending: false });

  if (error) console.error("Unable to load contract records:", error.message);
  const contracts = (data ?? []) as unknown as ContractRow[];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Portfolio CMS</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">Contract Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">Review internal contract drafts created from accepted quotations.</p>
          </div>
          <Link href="/admin" className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:border-[var(--accent)]">
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-800 dark:text-amber-300">
          Internal draft workspace only. Contract terms, governing law and the electronic-signature procedure have not yet received legal approval. Drafts cannot be sent or signed from this stage.
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-700 dark:text-red-400">
            Contract records could not be loaded. Check the server logs and database permissions.
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--card-border)] px-6 py-4">
            <h2 className="font-semibold text-[var(--text)]">Contracts</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">{contracts.length} record(s)</p>
          </div>
          {contracts.length ? (
            <div className="divide-y divide-[var(--card-border)]">
              {contracts.map((contract) => (
                <Link key={contract.id} href={`/admin/contracts/${contract.id}`} className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-[var(--bg)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{contract.contract_number}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {contract.clients?.full_name || contract.clients?.email || "Client profile"}
                      {" · "}
                      {contract.client_projects?.title || contract.quote_requests?.project_type || "Project"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Created {new Date(contract.created_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {formatMoney(contract.quote_requests?.quote_amount, contract.quote_requests?.quote_currency)}
                    </span>
                    <span className="rounded-full border border-[var(--card-border)] px-3 py-1 text-xs font-semibold capitalize text-[var(--muted)]">{contract.status.replaceAll("_", " ")}</span>
                    <span className="text-sm font-semibold text-[var(--accent)]">Review →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <h3 className="font-semibold text-[var(--text)]">No contract drafts yet</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
                Open an accepted quotation with a linked draft client project to create its first internal contract draft.
              </p>
              <Link href="/admin/quotes" className="mt-5 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Review quotations</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
