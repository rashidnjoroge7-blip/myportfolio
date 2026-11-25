CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE private.api_rate_limits (
    endpoint TEXT NOT NULL
        CHECK (endpoint IN ('contact', 'quote')),
    identifier_hash TEXT NOT NULL
        CHECK (identifier_hash ~ '^[a-f0-9]{64}$'),
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (endpoint, identifier_hash, window_start)
);

ALTER TABLE private.api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.api_rate_limits
FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
    p_endpoint TEXT,
    p_identifier_hash TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, private
AS $function$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_request_count INTEGER;
BEGIN
    IF p_endpoint IS NULL OR p_endpoint NOT IN ('contact', 'quote') THEN
        RAISE EXCEPTION 'Invalid rate limit endpoint';
    END IF;

    IF p_identifier_hash IS NULL OR p_identifier_hash !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Invalid identifier hash';
    END IF;

    IF p_limit < 1 OR p_limit > 100
       OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
        RAISE EXCEPTION 'Invalid rate limit configuration';
    END IF;

    v_window_start := to_timestamp(
        floor(
            extract(epoch FROM clock_timestamp()) / p_window_seconds
        ) * p_window_seconds
    );

    INSERT INTO private.api_rate_limits (
        endpoint,
        identifier_hash,
        window_start,
        request_count
    )
    VALUES (
        p_endpoint,
        p_identifier_hash,
        v_window_start,
        1
    )
    ON CONFLICT (endpoint, identifier_hash, window_start)
    DO UPDATE SET
        request_count = private.api_rate_limits.request_count + 1
    RETURNING request_count INTO v_request_count;

    IF random() < 0.01 THEN
        DELETE FROM private.api_rate_limits
        WHERE window_start < clock_timestamp() - INTERVAL '2 days';
    END IF;

    RETURN v_request_count <= p_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(
    TEXT, TEXT, INTEGER, INTEGER
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(
    TEXT, TEXT, INTEGER, INTEGER
) TO service_role;
