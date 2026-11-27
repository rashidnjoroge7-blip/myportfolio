BEGIN;

CREATE OR REPLACE FUNCTION public.create_contract_draft_from_accepted_quote(
  p_quote_id UUID,
  p_contract_title TEXT DEFAULT NULL
)
RETURNS TABLE (
  contract_id UUID,
  contract_number TEXT,
  contract_version_id UUID,
  client_project_id UUID,
  created BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_quote public.quote_requests%ROWTYPE;
  v_project public.client_projects%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
  v_version_id UUID;
  v_title TEXT;
  v_currency TEXT;
BEGIN
  IF p_quote_id IS NULL THEN
    RAISE EXCEPTION 'Quotation ID is required.';
  END IF;

  -- Serialize draft generation for this quote and preserve its accepted state.
  SELECT *
  INTO v_quote
  FROM public.quote_requests
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  IF v_quote.client_response IS DISTINCT FROM 'accepted'
     OR v_quote.status NOT IN ('quoted', 'completed') THEN
    RAISE EXCEPTION 'An accepted quotation is required before contract drafting.';
  END IF;

  -- Contract drafting is linked to the existing draft project record.
  -- Legacy active projects are intentionally excluded from automatic backfill.
  SELECT *
  INTO v_project
  FROM public.client_projects
  WHERE quote_request_id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Create the client project record before drafting its contract.';
  END IF;

  IF v_project.status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Only a draft client project can enter the new contract workflow.';
  END IF;

  IF v_project.client_id IS NULL THEN
    RAISE EXCEPTION 'The client project is not linked to a client profile.';
  END IF;

  SELECT *
  INTO v_client
  FROM public.clients
  WHERE id = v_project.client_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The project client profile could not be found.';
  END IF;

  IF lower(btrim(coalesce(v_project.client_email, ''))) <> lower(btrim(v_client.email))
     OR lower(btrim(coalesce(v_quote.email, ''))) <> lower(btrim(v_client.email)) THEN
    RAISE EXCEPTION 'The quotation, project and client profile email addresses do not match.';
  END IF;

  IF v_quote.quote_amount IS NULL OR v_quote.quote_amount <= 0 THEN
    RAISE EXCEPTION 'A positive, administrator-approved quotation amount is required.';
  END IF;

  v_currency := upper(coalesce(nullif(btrim(v_quote.quote_currency), ''), 'KES'));

  IF v_currency NOT IN ('KES', 'USD', 'EUR', 'GBP') THEN
    RAISE EXCEPTION 'The quotation currency is not supported for contract drafting.';
  END IF;

  -- Idempotent retry: return the existing complete draft rather than inserting
  -- a second contract for the same accepted quotation.
  SELECT *
  INTO v_contract
  FROM public.contracts
  WHERE quote_request_id = p_quote_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_contract.current_version_id IS NULL THEN
      RAISE EXCEPTION 'An existing contract has no current version and requires administrative reconciliation.';
    END IF;

    RETURN QUERY
    SELECT
      v_contract.id,
      v_contract.contract_number,
      v_contract.current_version_id,
      v_contract.client_project_id,
      false;
    RETURN;
  END IF;

  v_title := coalesce(
    nullif(btrim(p_contract_title), ''),
    nullif(btrim(v_project.title), ''),
    nullif(btrim(v_quote.project_name), ''),
    'Service Agreement'
  );

  IF length(v_title) > 180 THEN
    RAISE EXCEPTION 'Contract title must not exceed 180 characters.';
  END IF;

  INSERT INTO public.contracts (
    quote_request_id,
    client_id,
    client_project_id,
    status
  )
  VALUES (
    p_quote_id,
    v_client.id,
    v_project.id,
    'draft'
  )
  RETURNING * INTO v_contract;

  INSERT INTO public.contract_versions (
    contract_id,
    version_number,
    title,
    scope_snapshot,
    quote_snapshot,
    terms_text,
    total_amount,
    currency
  )
  VALUES (
    v_contract.id,
    1,
    v_title,
    jsonb_build_object(
      'client_project_id', v_project.id,
      'project_title', v_project.title,
      'project_type', v_quote.project_type,
      'project_description', v_quote.project_description,
      'features', v_quote.features,
      'timeline', v_quote.timeline,
      'budget_range', v_quote.budget_range
    ),
    jsonb_build_object(
      'quote_request_id', v_quote.id,
      'client_name', v_quote.name,
      'client_email', v_quote.email,
      'company', v_quote.company,
      'phone', v_quote.phone,
      'quote_amount', v_quote.quote_amount,
      'quote_currency', v_currency,
      'quote_valid_until', v_quote.quote_valid_until,
      'quote_notes', v_quote.quote_notes,
      'accepted_at', v_quote.client_response_at
    ),
    E'INTERNAL DRAFT ONLY\n\nThis record is an internal working draft. It is not an approved service agreement, must not be sent to the client, and must not be signed or treated as legally binding. Contract terms, governing law and signature procedures require appropriate legal review and explicit administrator approval.',
    v_quote.quote_amount,
    v_currency
  )
  RETURNING id INTO v_version_id;

  UPDATE public.contracts
  SET current_version_id = v_version_id,
      updated_at = now()
  WHERE id = v_contract.id;

  INSERT INTO public.contract_events (
    contract_id,
    version_id,
    event_type,
    actor_role,
    client_visible,
    details
  )
  VALUES (
    v_contract.id,
    v_version_id,
    'draft_created',
    'admin',
    false,
    jsonb_build_object(
      'source', 'accepted_quote',
      'quote_request_id', v_quote.id,
      'client_project_id', v_project.id,
      'note', 'Internal draft only; legal terms have not been approved.'
    )
  );

  RETURN QUERY
  SELECT
    v_contract.id,
    v_contract.contract_number,
    v_version_id,
    v_project.id,
    true;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.create_contract_draft_from_accepted_quote(UUID, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.create_contract_draft_from_accepted_quote(UUID, TEXT)
TO service_role;

COMMIT;
