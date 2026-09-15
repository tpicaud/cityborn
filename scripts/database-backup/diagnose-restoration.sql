BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';

SELECT jsonb_pretty(jsonb_build_object(
  'readOnly', current_setting('transaction_read_only'),
  'publications', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'name', p.pubname,
      'owner', pg_get_userbyid(p.pubowner),
      'allTables', p.puballtables,
      'publicSchema', EXISTS (
        SELECT FROM pg_publication_namespace pn
        WHERE pn.pnpubid = p.oid AND pn.pnnspid = 'public'::regnamespace
      ),
      'publicTables', coalesce((
        SELECT jsonb_agg(pt.tablename ORDER BY pt.tablename)
        FROM pg_publication_tables pt
        WHERE pt.pubname = p.pubname AND pt.schemaname = 'public'
      ), '[]'::jsonb)
    ) ORDER BY p.pubname)
    FROM pg_publication p
  ), '[]'::jsonb),
  'eventTriggers', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'name', e.evtname,
      'enabled', e.evtenabled,
      'event', e.evtevent,
      'owner', pg_get_userbyid(e.evtowner),
      'functionSchema', n.nspname,
      'functionName', p.proname,
      'functionOwner', r.rolname,
      'functionOwnerSuperuser', r.rolsuper,
      'tags', e.evttags
    ) ORDER BY e.evtname)
    FROM pg_event_trigger e
    JOIN pg_proc p ON p.oid = e.evtfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles r ON r.oid = p.proowner
  ), '[]'::jsonb)
));

ROLLBACK;
