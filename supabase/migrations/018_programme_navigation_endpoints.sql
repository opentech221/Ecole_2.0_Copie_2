-- ============================================================
-- Migration 018 : Programme navigation view + RPC endpoints
-- École 2.0
-- ============================================================

-- Flat navigation view (niveau > domaine > sous-domaine > activité)
drop view if exists public.programme_navigation_v;
create view public.programme_navigation_v as
select
  n.id as niveau_id,
  n.nom as niveau_nom,
  d.id as domaine_id,
  d.nom as domaine_nom,
  sd.id as sous_domaine_id,
  sd.nom as sous_domaine_nom,
  a.id as activite_id,
  a.nom as activite_nom,
  a.page_source,
  a.document_ref,
  (
    select count(*)::bigint
    from public.competences_base cb
    where cb.activite_id = a.id
  ) as competences_count,
  (
    select count(*)::bigint
    from public.paliers p
    join public.competences_base cb2 on cb2.id = p.competence_id
    where cb2.activite_id = a.id
  ) as paliers_count,
  (
    select count(*)::bigint
    from public.objectifs_apprentissage oa
    join public.paliers p2 on p2.id = oa.palier_id
    join public.competences_base cb3 on cb3.id = p2.competence_id
    where cb3.activite_id = a.id
  ) as oa_count,
  (
    select count(*)::bigint
    from public.objectifs_specifiques os
    join public.objectifs_apprentissage oa2 on oa2.id = os.oa_id
    join public.paliers p3 on p3.id = oa2.palier_id
    join public.competences_base cb4 on cb4.id = p3.competence_id
    where cb4.activite_id = a.id
  ) as os_count,
  (
    select count(*)::bigint
    from public.contenus c
    join public.objectifs_specifiques os2 on os2.id = c.os_id
    join public.objectifs_apprentissage oa3 on oa3.id = os2.oa_id
    join public.paliers p4 on p4.id = oa3.palier_id
    join public.competences_base cb5 on cb5.id = p4.competence_id
    where cb5.activite_id = a.id
  ) as contenus_count
from public.niveaux n
join public.domaines d on d.niveau_id = n.id
join public.sous_domaines sd on sd.domaine_id = d.id
join public.activites a on a.sous_domaine_id = sd.id;

comment on view public.programme_navigation_v is
'Vue de navigation pédagogique: niveau > domaine > sous-domaine > activité (avec compteurs).';

-- RPC: list niveaux with counters
create or replace function public.programme_get_niveaux()
returns table (
  id uuid,
  nom text,
  domaines_count bigint,
  activites_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    n.id,
    n.nom,
    (
      select count(*)::bigint
      from public.domaines d
      where d.niveau_id = n.id
    ) as domaines_count,
    (
      select count(*)::bigint
      from public.activites a
      join public.sous_domaines sd on sd.id = a.sous_domaine_id
      join public.domaines d2 on d2.id = sd.domaine_id
      where d2.niveau_id = n.id
    ) as activites_count
  from public.niveaux n
  order by n.nom;
$$;

-- RPC: list domaines for a niveau
create or replace function public.programme_get_domaines(p_niveau_id uuid)
returns table (
  id uuid,
  niveau_id uuid,
  nom text,
  sous_domaines_count bigint,
  activites_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.id,
    d.niveau_id,
    d.nom,
    (
      select count(*)::bigint
      from public.sous_domaines sd
      where sd.domaine_id = d.id
    ) as sous_domaines_count,
    (
      select count(*)::bigint
      from public.activites a
      join public.sous_domaines sd2 on sd2.id = a.sous_domaine_id
      where sd2.domaine_id = d.id
    ) as activites_count
  from public.domaines d
  where d.niveau_id = p_niveau_id
  order by d.nom;
$$;

-- RPC: list sous-domaines for a domaine
create or replace function public.programme_get_sous_domaines(p_domaine_id uuid)
returns table (
  id uuid,
  domaine_id uuid,
  nom text,
  activites_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    sd.id,
    sd.domaine_id,
    sd.nom,
    (
      select count(*)::bigint
      from public.activites a
      where a.sous_domaine_id = sd.id
    ) as activites_count
  from public.sous_domaines sd
  where sd.domaine_id = p_domaine_id
  order by coalesce(sd.nom, ''), sd.id;
$$;

-- RPC: list activités for a sous-domaine
create or replace function public.programme_get_activites(p_sous_domaine_id uuid)
returns table (
  id uuid,
  sous_domaine_id uuid,
  nom text,
  page_source integer,
  document_ref varchar,
  competences_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.id,
    a.sous_domaine_id,
    a.nom,
    a.page_source,
    a.document_ref,
    (
      select count(*)::bigint
      from public.competences_base cb
      where cb.activite_id = a.id
    ) as competences_count
  from public.activites a
  where a.sous_domaine_id = p_sous_domaine_id
  order by a.nom;
$$;

-- RPC: global search over navigation nodes
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
set search_path = public
as $$
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
  where
    coalesce(v.niveau_nom, '') ilike ('%' || coalesce(p_query, '') || '%')
    or coalesce(v.domaine_nom, '') ilike ('%' || coalesce(p_query, '') || '%')
    or coalesce(v.sous_domaine_nom, '') ilike ('%' || coalesce(p_query, '') || '%')
    or coalesce(v.activite_nom, '') ilike ('%' || coalesce(p_query, '') || '%')
  order by v.niveau_nom, v.domaine_nom, coalesce(v.sous_domaine_nom, ''), v.activite_nom
  limit greatest(coalesce(p_limit, 50), 1);
$$;

-- Data API exposure grants
grant select on public.programme_navigation_v to anon, authenticated, service_role;
grant execute on function public.programme_get_niveaux() to anon, authenticated, service_role;
grant execute on function public.programme_get_domaines(uuid) to anon, authenticated, service_role;
grant execute on function public.programme_get_sous_domaines(uuid) to anon, authenticated, service_role;
grant execute on function public.programme_get_activites(uuid) to anon, authenticated, service_role;
grant execute on function public.programme_search_navigation(text, integer) to anon, authenticated, service_role;
