BEGIN;

-- Contract management foundation.
-- The connected Supabase project already has these empty tables. This migration
-- makes the same schema reproducible in a fresh environment and safely verifies
-- the existing objects without deleting records.

CREATE SEQUENCE IF NOT EXISTS public.contract_number_seq
  AS bigint START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL DEFAULT (
    'UH-CON-' || to_char(CURRENT_DATE::timestamptz, 'YYYY') || '-' ||
    lpad(nextval('public.contract_number_seq'::regclass)::text, 6, '0')
  ),
  quote_request_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_project_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  current_version_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  scope_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  quote_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  terms_text TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  deposit_percent NUMERIC(5,2) NOT NULL DEFAULT 50,
  balance_percent NUMERIC(5,2) NOT NULL DEFAULT 50,
  document_path TEXT NULL,
  document_sha256 CHAR(64) NULL,
  issued_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  version_id UUID NOT NULL,
  signer_role TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  auth_user_id UUID NULL,
  signature_method TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  document_sha256 CHAR(64) NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL,
  version_id UUID NULL,
  event_type TEXT NOT NULL,
  actor_auth_user_id UUID NULL,
  actor_role TEXT NULL,
  client_visible BOOLEAN NOT NULL DEFAULT false,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique keys and lookup indexes.
CREATE UNIQUE INDEX IF NOT EXISTS contracts_contract_number_key
  ON public.contracts (contract_number);
CREATE UNIQUE INDEX IF NOT EXISTS contracts_quote_request_id_key
  ON public.contracts (quote_request_id);
CREATE INDEX IF NOT EXISTS contracts_client_id_idx
  ON public.contracts (client_id);
CREATE INDEX IF NOT EXISTS contracts_quote_request_id_idx
  ON public.contracts (quote_request_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx
  ON public.contracts (status);

CREATE UNIQUE INDEX IF NOT EXISTS contract_versions_contract_id_version_number_key
  ON public.contract_versions (contract_id, version_number);
CREATE UNIQUE INDEX IF NOT EXISTS contract_versions_id_contract_id_unique
  ON public.contract_versions (id, contract_id);
CREATE INDEX IF NOT EXISTS contract_versions_contract_id_idx
  ON public.contract_versions (contract_id);

CREATE UNIQUE INDEX IF NOT EXISTS contract_signatures_version_id_signer_role_key
  ON public.contract_signatures (version_id, signer_role);
CREATE INDEX IF NOT EXISTS contract_signatures_contract_id_idx
  ON public.contract_signatures (contract_id);

CREATE INDEX IF NOT EXISTS contract_events_contract_id_idx
  ON public.contract_events (contract_id);
CREATE INDEX IF NOT EXISTS contract_events_created_at_idx
  ON public.contract_events (created_at);

-- Constraints are added by name so this is safe to run against the existing
-- project as well as a clean database created from repository migrations.
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contracts'::regclass AND conname = 'contracts_quote_request_id_fkey') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_quote_request_id_fkey
      FOREIGN KEY (quote_request_id) REFERENCES public.quote_requests(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contracts'::regclass AND conname = 'contracts_client_id_fkey') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contracts'::regclass AND conname = 'contracts_client_project_id_fkey') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_client_project_id_fkey
      FOREIGN KEY (client_project_id) REFERENCES public.client_projects(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contracts'::regclass AND conname = 'contracts_current_version_fk') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_current_version_fk
      FOREIGN KEY (current_version_id) REFERENCES public.contract_versions(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contracts'::regclass AND conname = 'contracts_status_check') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check
      CHECK (status = ANY (ARRAY['draft','sent_to_client','client_signed','countersigned','executed','expired','voided']));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_contract_id_fkey') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_version_number_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_version_number_check CHECK (version_number > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_total_amount_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_total_amount_check CHECK (total_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_currency_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_currency_check
      CHECK (currency = ANY (ARRAY['KES','USD','EUR','GBP']));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_deposit_percent_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_deposit_percent_check
      CHECK (deposit_percent >= 0 AND deposit_percent <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_balance_percent_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_balance_percent_check
      CHECK (balance_percent >= 0 AND balance_percent <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_check
      CHECK (deposit_percent + balance_percent = 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_versions'::regclass AND conname = 'contract_versions_document_sha256_format_check') THEN
    ALTER TABLE public.contract_versions ADD CONSTRAINT contract_versions_document_sha256_format_check
      CHECK (document_sha256 IS NULL OR btrim(document_sha256) ~* '^[0-9a-f]{64}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_contract_id_fkey') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_version_id_fkey') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_version_id_fkey
      FOREIGN KEY (version_id) REFERENCES public.contract_versions(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_version_contract_fk') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_version_contract_fk
      FOREIGN KEY (version_id, contract_id) REFERENCES public.contract_versions(id, contract_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_auth_user_id_fkey') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_signer_role_check') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_signer_role_check
      CHECK (signer_role = ANY (ARRAY['client','unihost']));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_signature_method_check') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_signature_method_check
      CHECK (signature_method = ANY (ARRAY['typed_electronic','external']));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_signatures'::regclass AND conname = 'contract_signatures_document_sha256_format_check') THEN
    ALTER TABLE public.contract_signatures ADD CONSTRAINT contract_signatures_document_sha256_format_check
      CHECK (btrim(document_sha256) ~* '^[0-9a-f]{64}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_events'::regclass AND conname = 'contract_events_contract_id_fkey') THEN
    ALTER TABLE public.contract_events ADD CONSTRAINT contract_events_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_events'::regclass AND conname = 'contract_events_version_id_fkey') THEN
    ALTER TABLE public.contract_events ADD CONSTRAINT contract_events_version_id_fkey
      FOREIGN KEY (version_id) REFERENCES public.contract_versions(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contract_events'::regclass AND conname = 'contract_events_actor_auth_user_id_fkey') THEN
    ALTER TABLE public.contract_events ADD CONSTRAINT contract_events_actor_auth_user_id_fkey
      FOREIGN KEY (actor_auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$migration$;

CREATE OR REPLACE FUNCTION public.prevent_contract_record_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  RAISE EXCEPTION 'This contract record is append-only and cannot be modified or deleted.';
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_signed_contract_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.contract_signatures WHERE version_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'A signed contract version cannot be modified or deleted.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS contract_events_append_only ON public.contract_events;
CREATE TRIGGER contract_events_append_only
  BEFORE UPDATE OR DELETE ON public.contract_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_contract_record_changes();

DROP TRIGGER IF EXISTS contract_signatures_append_only ON public.contract_signatures;
CREATE TRIGGER contract_signatures_append_only
  BEFORE UPDATE OR DELETE ON public.contract_signatures
  FOR EACH ROW EXECUTE FUNCTION public.prevent_contract_record_changes();

DROP TRIGGER IF EXISTS protect_signed_contract_version_trigger ON public.contract_versions;
CREATE TRIGGER protect_signed_contract_version_trigger
  BEFORE UPDATE OR DELETE ON public.contract_versions
  FOR EACH ROW EXECUTE FUNCTION public.protect_signed_contract_version();

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own contracts" ON public.contracts;
CREATE POLICY "Clients can view own contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = contracts.client_id AND c.auth_user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Clients can view own contract versions" ON public.contract_versions;
CREATE POLICY "Clients can view own contract versions"
  ON public.contract_versions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.clients cl ON cl.id = c.client_id
    WHERE c.id = contract_versions.contract_id AND cl.auth_user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Clients can view own contract signatures" ON public.contract_signatures;
CREATE POLICY "Clients can view own contract signatures"
  ON public.contract_signatures FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.clients cl ON cl.id = c.client_id
    WHERE c.id = contract_signatures.contract_id AND cl.auth_user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Clients can view visible contract events" ON public.contract_events;
CREATE POLICY "Clients can view visible contract events"
  ON public.contract_events FOR SELECT TO authenticated
  USING (
    client_visible = true AND EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.clients cl ON cl.id = c.client_id
      WHERE c.id = contract_events.contract_id AND cl.auth_user_id = (SELECT auth.uid())
    )
  );

REVOKE ALL ON public.contracts, public.contract_versions,
  public.contract_signatures, public.contract_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.contracts, public.contract_versions,
  public.contract_signatures, public.contract_events TO authenticated;
GRANT ALL ON public.contracts, public.contract_versions,
  public.contract_signatures, public.contract_events TO service_role;
REVOKE ALL ON SEQUENCE public.contract_number_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.contract_number_seq TO service_role;

COMMIT;
