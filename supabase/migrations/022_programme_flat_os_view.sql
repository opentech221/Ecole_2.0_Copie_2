-- Migration 022 : Vue aplatie étendue au niveau OS/Contenus pour filtrage profond
-- École 2.0
-- Ce fichier ajoute une vue qui descend jusqu'aux objectifs spécifiques (OS) et
-- aux contenus afin de permettre le filtrage par mot-clé sur tout le programme.

set search_path = public;

drop view if exists public.programme_flat_os_v;

create or replace view public.programme_flat_os_v
with (security_barrier = true) as
select
  n.id               as niveau_id,
  n.nom              as niveau_nom,
  d.id               as domaine_id,
  d.nom              as domaine_nom,
  sd.id              as sous_domaine_id,
  sd.nom             as sous_domaine_nom,
  a.id               as activite_id,
  a.nom              as activite_nom,
  a.page_source,
  a.document_ref,
  cb.id              as competence_id,
  cb.description     as competence,
  p.id               as palier_id,
  p.nom              as palier_nom,
  oa.id              as oa_id,
  oa.titre           as oa_titre,
  os.id              as os_id,
  os.titre           as os_titre,
  c.id               as contenu_id,
  c.libelle          as contenu
from niveaux n
join domaines d              on d.niveau_id       = n.id
join sous_domaines sd        on sd.domaine_id     = d.id
join activites a             on a.sous_domaine_id = sd.id
join competences_base cb     on cb.activite_id    = a.id
join paliers p               on p.competence_id   = cb.id
join objectifs_apprentissage oa on oa.palier_id   = p.id
join objectifs_specifiques os   on os.oa_id       = oa.id
join contenus c              on c.os_id           = os.id;

comment on view public.programme_flat_os_v is
'Vue aplatie complète : niveau > domaine > sous-domaine > activité > CB > palier > OA > OS > contenu.
Utilisée pour la recherche full-text et le filtrage profond sans jointures en cascade côté client.';

grant select on public.programme_flat_os_v to anon, authenticated, service_role;

-- Index de support sur la vue matérialisée (si besoin de performances)
-- Note: PostgreSQL ne supporte pas les index sur les vues simples.
-- Pour des performances optimales, créer une vue matérialisée :
-- CREATE MATERIALIZED VIEW programme_flat_os_mv AS SELECT * FROM programme_flat_os_v;
-- CREATE INDEX ON programme_flat_os_mv (niveau_nom, activite_nom);
-- CREATE INDEX ON programme_flat_os_mv USING gin(to_tsvector('french', coalesce(os_titre,'') || ' ' || coalesce(contenu,'')));
