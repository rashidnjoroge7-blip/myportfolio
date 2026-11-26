BEGIN;

-- Client identity is anchored to a verified Supabase Auth UUID, never email alone.
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NULL,
  email TEXT NOT NULL,
  full_name TEXT NULL,
  company_name TEXT NULL,
  phone TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_auth_user_id_unique
  ON public.clients (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_normalized_unique
  ON public.clients (lower(btrim(email)));
CREATE INDEX IF NOT EXISTS clients_email_lookup_idx
  ON public.clients (lower(btrim(email)));

ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS client_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_projects_client_id_fkey'
      AND conrelid = 'public.client_projects'::regclass
  ) THEN
    ALTER TABLE public.client_projects
      ADD CONSTRAINT client_projects_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Backfill legacy projects deterministically by normalized email.
INSERT INTO public.clients (email)
SELECT DISTINCT lower(btrim(cp.client_email))
FROM public.client_projects cp
WHERE NULLIF(btrim(cp.client_email), '') IS NOT NULL
ON CONFLICT DO NOTHING;

UPDATE public.client_projects cp
SET client_id = c.id
FROM public.clients c
WHERE cp.client_id IS NULL
  AND lower(btrim(cp.client_email)) = lower(btrim(c.email));

CREATE INDEX IF NOT EXISTS client_projects_client_id_created_at_idx
  ON public.client_projects (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS milestones_client_project_id_idx
  ON public.milestones (client_project_id);

-- Keep a bounded audit trail when a client requests a quotation revision.
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS quote_send_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_response_history JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quote_requests_quote_send_count_check'
      AND conrelid = 'public.quote_requests'::regclass
  ) THEN
    ALTER TABLE public.quote_requests
      ADD CONSTRAINT quote_requests_quote_send_count_check
      CHECK (quote_send_count BETWEEN 0 AND 2);
  END IF;
END $$;

-- One atomic conversion creates/locates the client and creates a draft project.
CREATE OR REPLACE FUNCTION public.convert_accepted_quote_to_project(
  p_quote_id UUID,
  p_project_title TEXT
)
RETURNS TABLE (project_id UUID, project_title TEXT, client_email TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_quote public.quote_requests%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_project_id UUID;
  v_email TEXT;
  v_title TEXT;
BEGIN
  IF p_quote_id IS NULL THEN
    RAISE EXCEPTION 'Quotation ID is required.';
  END IF;

  v_title := NULLIF(BTRIM(p_project_title), '');
  IF v_title IS NULL OR length(v_title) > 200 THEN
    RAISE EXCEPTION 'Project title must contain between 1 and 200 characters.';
  END IF;

  SELECT * INTO v_quote
  FROM public.quote_requests
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found.'; END IF;
  IF v_quote.status <> 'quoted'
     OR v_quote.client_response IS DISTINCT FROM 'accepted' THEN
    RAISE EXCEPTION 'A currently accepted quotation is required.';
  END IF;

  v_email := lower(btrim(v_quote.email));
  IF v_email = '' THEN RAISE EXCEPTION 'Quotation email is missing.'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_email, 0));

  IF EXISTS (SELECT 1 FROM public.client_projects cp WHERE cp.quote_request_id = p_quote_id) THEN
    RAISE EXCEPTION 'A client project already exists for this quotation.';
  END IF;

  SELECT * INTO v_client
  FROM public.clients c
  WHERE lower(btrim(c.email)) = v_email
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.clients (email, full_name, company_name, phone)
    VALUES (v_email, v_quote.name, v_quote.company, v_quote.phone)
    RETURNING * INTO v_client;
  END IF;

  INSERT INTO public.client_projects (quote_request_id, client_id, client_email, title, status)
  VALUES (p_quote_id, v_client.id, v_email, v_title, 'draft')
  RETURNING id INTO v_project_id;

  UPDATE public.quote_requests
  SET status = 'completed', updated_at = now()
  WHERE id = p_quote_id;

  RETURN QUERY SELECT v_project_id, v_title, v_email;
END;
$function$;

REVOKE ALL ON FUNCTION public.convert_accepted_quote_to_project(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_accepted_quote_to_project(UUID, TEXT)
  TO service_role;

-- Reserve a send atomically. A revision request is archived before a new proposal
-- is prepared; an accepted quotation cannot be resent or have its acceptance erased.
CREATE OR REPLACE FUNCTION public.reserve_quote_proposal_send(p_quote_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_quote public.quote_requests%ROWTYPE;
  v_count INTEGER;
BEGIN
  SELECT * INTO v_quote
  FROM public.quote_requests
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found.'; END IF;
  IF v_quote.status IN ('completed', 'cancelled')
     OR v_quote.client_response = 'accepted' THEN
    RAISE EXCEPTION 'This quotation is no longer eligible for another proposal.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.client_projects cp WHERE cp.quote_request_id = p_quote_id) THEN
    RAISE EXCEPTION 'A project already exists for this quotation.';
  END IF;
  IF v_quote.quote_send_count >= 2 THEN
    RAISE EXCEPTION 'Quotation send limit reached.';
  END IF;

  UPDATE public.quote_requests
  SET quote_send_count = quote_send_count + 1,
      quote_response_history = CASE
        WHEN client_response IS NOT NULL THEN
          quote_response_history || jsonb_build_array(jsonb_build_object(
            'response', client_response,
            'response_at', client_response_at,
            'revision_notes', revision_notes,
            'archived_at', now()
          ))
        ELSE quote_response_history
      END,
      client_response = NULL,
      client_response_at = NULL,
      revision_notes = NULL,
      status = 'reviewing',
      quote_sent_at = NULL,
      updated_at = now()
  WHERE id = p_quote_id
  RETURNING quote_send_count INTO v_count;

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_quote_proposal_send(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_quote_proposal_send(UUID)
  TO service_role;

-- UUID ownership is the only client-facing authorization path.
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their projects by identity" ON public.client_projects;
CREATE POLICY "Clients can view their projects by identity"
  ON public.client_projects FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_projects.client_id
      AND c.auth_user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Clients can view milestones for their projects" ON public.milestones;
CREATE POLICY "Clients can view milestones for their projects"
  ON public.milestones FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.client_projects cp
    JOIN public.clients c ON c.id = cp.client_id
    WHERE cp.id = milestones.client_project_id
      AND c.auth_user_id = (SELECT auth.uid())
  ));

COMMIT;
