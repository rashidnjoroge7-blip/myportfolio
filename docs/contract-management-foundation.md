# Contract management foundation

## Scope

This implementation extends the existing quotation, client and project workflow. It does not create a second CRM or project system.

The contract workflow must preserve the business gates in `PROJECT_ROADMAP.md` and `AGENTS.md`:

- An accepted quotation is not an executed contract.
- A client project must remain in `draft` until contract and payment/kickoff conditions are satisfied.
- Contract wording, template, governing law and signing procedure require legal review before production use.
- Client data is only visible to the authenticated client linked by the existing client UUID.
- Admin writes must use server-side authorization and the service-role Supabase client.
- Signed versions, signature evidence and audit events are append-only.

## Existing live database findings (checked 27 November 2026)

The connected Supabase project already contains the following empty tables:

| Table | Rows | Purpose |
|---|---:|---|
| `contracts` | 0 | Contract header, quotation/client links, status and current version |
| `contract_versions` | 0 | Scope and quotation snapshots, terms, price/deposit split and document hash |
| `contract_signatures` | 0 | Client/provider signature evidence tied to a specific version |
| `contract_events` | 0 | Append-only contract audit events |

Current database characteristics:

- One contract per quotation is enforced by a unique `quote_request_id`.
- Contract numbers use the `UH-CON-YYYY-NNNNNN` sequence.
- Contract versions are uniquely numbered per contract.
- Deposit and balance percentages must total 100.
- Supported currencies are KES, USD, EUR and GBP.
- Signature roles are `client` and `unihost`.
- Signature methods currently allow `typed_electronic` and `external`.
- Contract signatures and events have append-only triggers.
- A contract version with signature evidence cannot be updated or deleted.
- RLS is enabled on all four tables. Clients have SELECT-only policies scoped through `clients.auth_user_id = auth.uid()`. Writes are reserved for trusted server-side operations.
- The live database has no payment/transaction table yet.

Important source-control gap:

- These four tables and their policies existed in the live database but did not have a corresponding entry in the Supabase migration history or a migration file on the onboarding branch.
- The Prisma schema also lacked these models.
- This feature adds a reproducible migration and Prisma models so the repository becomes the source of truth.

## Implementation sequence

### 1. Schema baseline and type alignment

- Track the existing contract tables, indexes, constraints, trigger functions, immutable-record triggers and client SELECT policies in Supabase migrations.
- Add matching Prisma models and relations.
- Do not add payment tables or Daraja callbacks in this schema-baseline step.
- Validate the migration idempotently against the current empty live tables before registering it.

### 2. Admin draft workflow

- Allow an administrator to create one draft contract from an accepted quotation and its linked client.
- Snapshot the approved quotation and project scope into version 1.
- Record price, currency, deposit percentage and balance percentage as explicit version fields.
- Require a complete internal review before sending any contract to a client.
- Prevent duplicate contract creation for the same quotation.

### 3. Client review and amendments

- Expose only the authenticated client's own contract, current version and client-visible events.
- Allow review and revision requests only through validated server-side state transitions.
- Preserve each amendment as a new immutable version; never overwrite a version already signed.

### 4. Signing and execution

- Capture the exact document hash, signatory, role, consent text, authenticated actor and timestamp.
- Require client signature and UniHost countersignature for the same contract version before marking it executed.
- Do not enable production signing until the contract template and signature method have received legal review and the owner has approved the process.
- Preserve executed documents and signature evidence as immutable records.

### 5. Deposit and project activation

- Introduce M-Pesa/Daraja only after the business has supplied approved credentials and payment callback details.
- Verify payment callbacks server-side and make transaction processing idempotent.
- Activate the linked client project only after the contract is executed, required deposit is verified (where applicable), effective date is reached and an administrator approves kickoff.
- An accepted quotation alone must never change a project from `draft` to `active`.

## Explicitly out of scope for the foundation

- Writing or claiming legal approval of contract clauses.
- Sending a legally binding agreement to a client.
- Capturing a production signature.
- Collecting real M-Pesa payments.
- Activating existing draft client projects.

## Acceptance checks

- A fresh database can create all four contract tables from tracked migrations.
- Applying the migration to the current live database is idempotent and preserves existing objects/data.
- Prisma generation succeeds with the four models and relations.
- Client RLS returns only contracts linked to the current Auth UUID.
- Authenticated clients cannot insert, update or delete contract records or signature/audit evidence.
- Trusted admin server actions can create draft contracts and append audit events.
- Duplicate contracts for a quotation are rejected.
- Signature evidence is append-only, and signed versions cannot be changed.
- No project is activated before the contract/payment/kickoff gates are satisfied.

## Legal and operational dependencies

Before production signing, the business owner must approve:

- Contract template and governing-law wording after appropriate legal review.
- Authorised UniHost signatory identity.
- Whether signing will use an approved external provider or typed electronic acceptance with explicit consent and appropriate evidence.
- Required deposit rules and any contract-specific exceptions.
- Safaricom Daraja environment, credentials, callback URL and reconciliation process.
