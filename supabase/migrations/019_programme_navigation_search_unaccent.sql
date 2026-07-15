-- ============================================================
-- Migration 019 : Accent-insensitive search for programme nav
-- ============================================================

create extension if not exists unaccent with schema extensions;

create or replace function public.programme_search_navigation(
  p_query text,
  p_limit integer default 50
)
returns table (
  niveau_id uuid,
  niveau_nom text,
  domaine_id uuid,
  domaine_nom text,
  sous_domaine_id uuid,
  sous_domaine_nom text,
  activite_id uuid,
  activite_nom text,
  page_source integer,
  document_ref varchar
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (
    select lower(extensions.unaccent(coalesce(p_query, ''))) as term
  )
  select
    v.niveau_id,
    v.niveau_nom,
    v.domaine_id,
    v.domaine_nom,
    v.sous_domaine_id,
    v.sous_domaine_nom,
    v.activite_id,
    v.activite_nom,
    v.page_source,
    v.document_ref
  from public.programme_navigation_v v
  cross join q
  where
    q.term = ''
    or lower(extensions.unaccent(coalesce(v.niveau_nom, ''))) like ('%' || q.term || '%')
    or lower(extensions.unaccent(coalesce(v.domaine_nom, ''))) like ('%' || q.term || '%')
    or lower(extensions.unaccent(coalesce(v.sous_domaine_nom, ''))) like ('%' || q.term || '%')
    or lower(extensions.unaccent(coalesce(v.activite_nom, ''))) like ('%' || q.term || '%')
  order by v.niveau_nom, v.domaine_nom, coalesce(v.sous_domaine_nom, ''), v.activite_nom
  limit greatest(coalesce(p_limit, 50), 1);
$$;

comment on function public.programme_search_navigation(text, integer) is
'Recherche accent-insensitive dans la navigation pédagogique.';
