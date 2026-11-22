BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS
    client_projects_quote_request_id_unique
ON public.client_projects (quote_request_id)
WHERE quote_request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.convert_accepted_quote_to_project(
    p_quote_id UUID,
    p_project_title TEXT
)
RETURNS TABLE (
    project_id UUID,
    project_title TEXT,
    client_email TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_quote public.quote_requests%ROWTYPE;
    v_project_id UUID;
    v_title TEXT;
BEGIN
    IF p_quote_id IS NULL THEN
        RAISE EXCEPTION 'Quotation ID is required.';
    END IF;

    v_title := NULLIF(BTRIM(p_project_title), '');

    IF v_title IS NULL OR LENGTH(v_title) > 200 THEN
        RAISE EXCEPTION
            'Project title must contain between 1 and 200 characters.';
    END IF;

    SELECT *
    INTO v_quote
    FROM public.quote_requests
    WHERE id = p_quote_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quotation not found.';
    END IF;

    IF v_quote.status <> 'quoted' THEN
        RAISE EXCEPTION
            'Quotation must have quoted status before conversion.';
    END IF;

    IF v_quote.client_response IS DISTINCT FROM 'accepted' THEN
        RAISE EXCEPTION
            'Client acceptance is required before project conversion.';
    END IF;

    IF NULLIF(BTRIM(v_quote.email), '') IS NULL THEN
        RAISE EXCEPTION
            'Quotation does not have a valid client email.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.client_projects cp
        WHERE cp.quote_request_id = p_quote_id
    ) THEN
        RAISE EXCEPTION
            'A client project already exists for this quotation.';
    END IF;

    INSERT INTO public.client_projects (
        quote_request_id,
        client_email,
        title,
        status
    )
    VALUES (
        p_quote_id,
        LOWER(BTRIM(v_quote.email)),
        v_title,
        'active'
    )
    RETURNING id INTO v_project_id;

    UPDATE public.quote_requests
    SET
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_quote_id;

    RETURN QUERY
    SELECT
        v_project_id,
        v_title,
        LOWER(BTRIM(v_quote.email));
END;
$function$;

REVOKE ALL ON FUNCTION
    public.convert_accepted_quote_to_project(UUID, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.convert_accepted_quote_to_project(UUID, TEXT)
TO service_role;

COMMIT;
