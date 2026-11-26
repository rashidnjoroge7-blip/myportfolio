BEGIN;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.clients FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.clients TO authenticated;

DROP POLICY IF EXISTS "Clients can view their own identity" ON public.clients;
CREATE POLICY "Clients can view their own identity"
  ON public.clients FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

REVOKE INSERT, UPDATE, DELETE ON public.clients FROM anon, authenticated;
GRANT SELECT ON public.client_projects, public.milestones TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.client_projects, public.milestones
  FROM anon, authenticated;

COMMIT;
