-- Add structured project estimator data to existing quotation requests.

ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS estimate_min NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS estimate_max NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS estimate_currency VARCHAR(3) NOT NULL DEFAULT 'KES',
ADD COLUMN IF NOT EXISTS estimator_details JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS submission_source VARCHAR(30) NOT NULL DEFAULT 'quote_form';

-- Ensure estimate values are valid.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quote_requests_estimate_range_check'
    ) THEN
        ALTER TABLE public.quote_requests
        ADD CONSTRAINT quote_requests_estimate_range_check
        CHECK (
            (estimate_min IS NULL AND estimate_max IS NULL)
            OR
            (
                estimate_min IS NOT NULL
                AND estimate_max IS NOT NULL
                AND estimate_min >= 0
                AND estimate_max >= estimate_min
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quote_requests_submission_source_check'
    ) THEN
        ALTER TABLE public.quote_requests
        ADD CONSTRAINT quote_requests_submission_source_check
        CHECK (submission_source IN ('quote_form', 'project_estimator'));
    END IF;
END $$;

COMMENT ON COLUMN public.quote_requests.estimate_min IS
'Indicative minimum project estimate; not a formal quotation.';

COMMENT ON COLUMN public.quote_requests.estimate_max IS
'Indicative maximum project estimate; not a formal quotation.';

COMMENT ON COLUMN public.quote_requests.estimator_details IS
'Structured selections submitted through the project cost estimator.';
