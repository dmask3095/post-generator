begin;
select plan(9);

select has_table('public', 'crossloop_prospects', 'prospects table exists');
select has_column('public', 'crossloop_prospects', 'user_id', 'prospects are owned by a user');
select has_column('public', 'crossloop_prospects', 'platform', 'platform is stored');
select has_column('public', 'crossloop_prospects', 'source_url', 'evidence source is stored');
select has_column('public', 'crossloop_prospects', 'outreach_message', 'personalized draft is stored');
select has_column('public', 'crossloop_prospects', 'affiliate_terms_verified', 'affiliate terms verification is stored');
select ok((select relrowsecurity from pg_class where oid = 'public.crossloop_prospects'::regclass), 'row-level security is enabled');
select ok((select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'crossloop_prospects'), 'four owner-scoped policies exist');
select ok(
  (select count(*) = 4 from pg_policies
   where schemaname = 'public' and tablename = 'crossloop_prospects'
     and coalesce(qual, '') like '%auth.uid%'
     and coalesce(with_check, '') like '%auth.uid%'),
  'all policies scope access to the signed-in user'
);

select * from finish();
rollback;
