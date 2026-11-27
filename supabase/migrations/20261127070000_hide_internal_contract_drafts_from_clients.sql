BEGIN;

-- Contract drafts are internal work product. Clients may only read a contract
-- after an administrator explicitly moves it to the client-review stage.
DROP POLICY IF EXISTS "Clients can view own contracts" ON public.contracts;
CREATE POLICY "Clients can view own non-draft contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (
    status <> 'draft'
    AND EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = contracts.client_id
        AND c.auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view own contract versions" ON public.contract_versions;
CREATE POLICY "Clients can view own non-draft contract versions"
  ON public.contract_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.clients cl ON cl.id = c.client_id
      WHERE c.id = contract_versions.contract_id
        AND c.status <> 'draft'
        AND cl.auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view own contract signatures" ON public.contract_signatures;
CREATE POLICY "Clients can view own non-draft contract signatures"
  ON public.contract_signatures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.clients cl ON cl.id = c.client_id
      WHERE c.id = contract_signatures.contract_id
        AND c.status <> 'draft'
        AND cl.auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view visible contract events" ON public.contract_events;
CREATE POLICY "Clients can view visible contract events"
  ON public.contract_events FOR SELECT TO authenticated
  USING (
    client_visible = true
    AND EXISTS (
      SELECT 1
      FROM public.contracts c
      JOIN public.clients cl ON cl.id = c.client_id
      WHERE c.id = contract_events.contract_id
        AND c.status <> 'draft'
        AND cl.auth_user_id = (SELECT auth.uid())
    )
  );

COMMIT;
