-- Fill missing contenus for CE2 / Langue et Communication where OS has zero contenu.
-- This migration is idempotent and targets only the two affected activities.

insert into public.contenus (id, os_id, libelle)
select
  gen_random_uuid() as id,
  target_os.id as os_id,
  concat('Contenu repere: ', target_os.titre) as libelle
from (
  select
    os.id,
    os.titre
  from public.objectifs_specifiques os
  join public.objectifs_apprentissage oa on oa.id = os.oa_id
  join public.paliers p on p.id = oa.palier_id
  join public.competences_base cb on cb.id = p.competence_id
  join public.activites a on a.id = cb.activite_id
  join public.sous_domaines sd on sd.id = a.sous_domaine_id
  join public.domaines d on d.id = sd.domaine_id
  join public.niveaux n on n.id = d.niveau_id
  left join public.contenus c on c.os_id = os.id
  where n.nom = 'CE2'
    and d.nom = 'Langue et Communication'
    and a.nom in ('Lecture', 'Expression orale et récitation')
  group by os.id, os.titre
  having count(c.id) = 0
) as target_os
where not exists (
  select 1
  from public.contenus existing
  where existing.os_id = target_os.id
);
