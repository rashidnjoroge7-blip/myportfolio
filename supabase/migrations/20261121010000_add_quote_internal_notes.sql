ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS internal_notes text;

COMMENT ON COLUMN public.quote_requests.internal_notes
IS 'Private internal notes for administrators. Never expose to clients.';
