BEGIN;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS proposal_send_token UUID NULL,
  ADD COLUMN IF NOT EXISTS proposal_send_reserved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS proposal_send_email_sent_at TIMESTAMPTZ NULL;

-- Claim a short-lived reservation without consuming a send or changing the
-- client's response. Concurrent administrators cannot reserve the same quote.
CREATE OR REPLACE FUNCTION public.acquire_quote_proposal_send(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_quote public.quote_requests%ROWTYPE;
  v_token UUID;
BEGIN
  SELECT * INTO v_quote
  FROM public.quote_requests
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  IF v_quote.status IN ('completed', 'cancelled')
     OR v_quote.client_response = 'accepted' THEN
    RAISE EXCEPTION 'This quotation is no longer eligible for another proposal.';
  END IF;

  IF v_quote.quote_send_count >= 2 THEN
    RAISE EXCEPTION 'Quotation send limit reached.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.client_projects cp
    WHERE cp.quote_request_id = p_quote_id
  ) THEN
    RAISE EXCEPTION 'A project already exists for this quotation.';
  END IF;

  IF v_quote.proposal_send_token IS NOT NULL THEN
    IF v_quote.proposal_send_email_sent_at IS NOT NULL THEN
      RAISE EXCEPTION 'A sent proposal is awaiting finalization.';
    END IF;

    IF v_quote.proposal_send_reserved_at > now() - interval '15 minutes' THEN
      RAISE EXCEPTION 'A proposal send is already in progress.';
    END IF;

    -- Recover an abandoned reservation only when no successful delivery has
    -- been recorded. The send count and client response remain untouched.
    UPDATE public.quote_requests
    SET proposal_send_token = NULL,
        proposal_send_reserved_at = NULL,
        proposal_send_email_sent_at = NULL
    WHERE id = p_quote_id;
  END IF;

  v_token := gen_random_uuid();

  UPDATE public.quote_requests
  SET proposal_send_token = v_token,
      proposal_send_reserved_at = now(),
      proposal_send_email_sent_at = NULL,
      updated_at = now()
  WHERE id = p_quote_id;

  RETURN v_token;
END;
$function$;

-- Record successful provider hand-off before finalizing the send counter.
CREATE OR REPLACE FUNCTION public.mark_quote_proposal_email_sent(
  p_quote_id UUID,
  p_reservation_token UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  UPDATE public.quote_requests
  SET proposal_send_email_sent_at = now(),
      updated_at = now()
  WHERE id = p_quote_id
    AND proposal_send_token = p_reservation_token
    AND proposal_send_email_sent_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal reservation was not found or has already changed.';
  END IF;
END;
$function$;

-- Finalize only after successful email delivery has been recorded. This is
-- deliberately safe to retry from the admin screen if the final DB call fails.
CREATE OR REPLACE FUNCTION public.finalize_quote_proposal_send(p_quote_id UUID)
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  IF v_quote.proposal_send_token IS NULL
     OR v_quote.proposal_send_email_sent_at IS NULL THEN
    RAISE EXCEPTION 'No successfully delivered proposal is awaiting finalization.';
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
      status = 'quoted',
      quote_sent_at = proposal_send_email_sent_at,
      proposal_send_token = NULL,
      proposal_send_reserved_at = NULL,
      proposal_send_email_sent_at = NULL,
      updated_at = now()
  WHERE id = p_quote_id
  RETURNING quote_send_count INTO v_count;

  RETURN v_count;
END;
$function$;

-- Release only failed sends. A successfully delivered email must be finalized,
-- not released and resent.
CREATE OR REPLACE FUNCTION public.release_quote_proposal_send(
  p_quote_id UUID,
  p_reservation_token UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  UPDATE public.quote_requests
  SET proposal_send_token = NULL,
      proposal_send_reserved_at = NULL,
      proposal_send_email_sent_at = NULL,
      updated_at = now()
  WHERE id = p_quote_id
    AND proposal_send_token = p_reservation_token
    AND proposal_send_email_sent_at IS NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.acquire_quote_proposal_send(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_quote_proposal_email_sent(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_quote_proposal_send(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_quote_proposal_send(UUID, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.acquire_quote_proposal_send(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_quote_proposal_email_sent(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_quote_proposal_send(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_quote_proposal_send(UUID, UUID) TO service_role;

COMMIT;
