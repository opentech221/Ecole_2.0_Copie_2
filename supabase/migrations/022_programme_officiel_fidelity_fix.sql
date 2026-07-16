-- Fix programme_officiel fidelity against the official JSON corpus.
-- 1) Remove synthetic CE2 Langue et Communication contenus.
-- 2) Split the merged CM2 Résolution de problèmes objective-specific row.

alter table public.objectifs_specifiques
  drop constraint if exists objectifs_specifiques_oa_id_titre_key;

delete from public.contenus c
using public.objectifs_specifiques os
join public.objectifs_apprentissage oa on oa.id = os.oa_id
join public.paliers p on p.id = oa.palier_id
join public.competences_base cb on cb.id = p.competence_id
join public.activites a on a.id = cb.activite_id
join public.sous_domaines sd on sd.id = a.sous_domaine_id
join public.domaines d on d.id = sd.domaine_id
join public.niveaux n on n.id = d.niveau_id
where c.os_id = os.id
  and n.nom = 'CE2'
  and d.nom = 'Langue et Communication'
  and a.nom in ('Lecture', 'Expression orale et récitation');

with source_os as (
  select os.id, os.oa_id, os.titre
  from public.objectifs_specifiques os
  join public.objectifs_apprentissage oa on oa.id = os.oa_id
  join public.paliers p on p.id = oa.palier_id
  join public.competences_base cb on cb.id = p.competence_id
  join public.activites a on a.id = cb.activite_id
  join public.sous_domaines sd on sd.id = a.sous_domaine_id
  join public.domaines d on d.id = sd.domaine_id
  join public.niveaux n on n.id = d.niveau_id
  where n.nom = 'CM2'
    and d.nom = 'Mathématiques'
    and a.nom = 'Résolution de problèmes'
    and oa.titre = 'Construire un énoncé.'
    and os.titre = 'Construire un énoncé à partir de données.'
  order by os.id
  limit 1
),
existing_target as (
  select os.id
  from public.objectifs_specifiques os
  join source_os s on s.oa_id = os.oa_id
                    and s.titre = os.titre
                    and os.id <> s.id
  limit 1
),
inserted_target as (
  insert into public.objectifs_specifiques (id, oa_id, titre)
  select gen_random_uuid(), s.oa_id, s.titre
  from source_os s
  where not exists (select 1 from existing_target)
  returning id
),
target as (
  select id from existing_target
  union all
  select id from inserted_target
),
solution_content as (
  select c.id
  from public.contenus c
  join source_os s on c.os_id = s.id
  where c.libelle = 'Solutions de problèmes'
  order by c.id
  limit 1
)
update public.contenus c
set os_id = (select id from target limit 1)
where c.id = (select id from solution_content);