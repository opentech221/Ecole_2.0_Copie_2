-- ============================================================
-- Migration 015 : Programme officiel schema foundation
-- École 2.0
-- ============================================================

create table if not exists public.niveaux (
	id uuid primary key default gen_random_uuid(),
	nom text not null unique,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.domaines (
	id uuid primary key default gen_random_uuid(),
	niveau_id uuid not null references public.niveaux(id) on delete cascade,
	nom text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (niveau_id, nom)
);

create table if not exists public.sous_domaines (
	id uuid primary key default gen_random_uuid(),
	domaine_id uuid not null references public.domaines(id) on delete cascade,
	nom text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (domaine_id, nom)
);

create table if not exists public.activites (
	id uuid primary key default gen_random_uuid(),
	sous_domaine_id uuid not null references public.sous_domaines(id) on delete cascade,
	nom text not null,
	page_source integer,
	document_ref varchar,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (sous_domaine_id, nom)
);

create table if not exists public.competences_base (
	id uuid primary key default gen_random_uuid(),
	activite_id uuid not null references public.activites(id) on delete cascade,
	libelle text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.paliers (
	id uuid primary key default gen_random_uuid(),
	competence_id uuid not null references public.competences_base(id) on delete cascade,
	nom text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.objectifs_apprentissage (
	id uuid primary key default gen_random_uuid(),
	palier_id uuid not null references public.paliers(id) on delete cascade,
	titre text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.objectifs_specifiques (
	id uuid primary key default gen_random_uuid(),
	oa_id uuid not null references public.objectifs_apprentissage(id) on delete cascade,
	titre text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.contenus (
	id uuid primary key default gen_random_uuid(),
	os_id uuid not null references public.objectifs_specifiques(id) on delete cascade,
	libelle text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_domaines_niveau_id on public.domaines(niveau_id);
create index if not exists idx_sous_domaines_domaine_id on public.sous_domaines(domaine_id);
create index if not exists idx_activites_sous_domaine_id on public.activites(sous_domaine_id);
create index if not exists idx_competences_base_activite_id on public.competences_base(activite_id);
create index if not exists idx_paliers_competence_id on public.paliers(competence_id);
create index if not exists idx_objectifs_apprentissage_palier_id on public.objectifs_apprentissage(palier_id);
create index if not exists idx_objectifs_specifiques_oa_id on public.objectifs_specifiques(oa_id);
create index if not exists idx_contenus_os_id on public.contenus(os_id);

grant select on public.niveaux to anon, authenticated, service_role;
grant select on public.domaines to anon, authenticated, service_role;
grant select on public.sous_domaines to anon, authenticated, service_role;
grant select on public.activites to anon, authenticated, service_role;
grant select on public.competences_base to anon, authenticated, service_role;
grant select on public.paliers to anon, authenticated, service_role;
grant select on public.objectifs_apprentissage to anon, authenticated, service_role;
grant select on public.objectifs_specifiques to anon, authenticated, service_role;
grant select on public.contenus to anon, authenticated, service_role;
