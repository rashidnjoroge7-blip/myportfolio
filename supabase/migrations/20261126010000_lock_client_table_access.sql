BEGIN;

-- Remove legacy policies first so an old email-based policy cannot continue
-- granting access alongside the new UUID ownership rules.
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('clients', 'client_projects', 'milestones')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      v_policy.policyname,
      v_policy.tablename
    );
  END LOOP;
END $$;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.clients FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.clients TO authenticated;

CREATE POLICY "Clients can view their own identity"
  ON public.clients FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "Clients can view their projects by identity"
  ON public.client_projects FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_projects.client_id
      AND c.auth_user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Clients can view milestones for their projects"
  ON public.milestones FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.client_projects cp
    JOIN public.clients c ON c.id = cp.client_id
    WHERE cp.id = milestones.client_project_id
      AND c.auth_user_id = (SELECT auth.uid())
  ));

REVOKE INSERT, UPDATE, DELETE ON public.clients FROM anon, authenticated;
GRANT SELECT ON public.client_projects, public.milestones TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.client_projects, public.milestones
  FROM anon, authenticated;

COMMIT;
