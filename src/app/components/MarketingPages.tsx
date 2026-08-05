import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  BookMarked,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChartColumnBig,
  ClipboardCheck,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  Layers,
  Menu,
  NotebookPen,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserCheck,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router";
import "../../styles/marketing.css";

const NAV_LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Fonctionnalités", to: "/fonctionnalites" },
  { label: "Démonstration", to: "/demo" },
];

const PILLARS = [
  {
    title: "Fiches pédagogiques quotidiennes",
    text: "Créez rapidement des fiches de préparation, une tâche répétitive réalisée plusieurs fois par jour, avec un cadre structuré et réutilisable.",
  },
  {
    title: "Planification mensuelle structurée",
    text: "Organisez vos apprentissages mois par mois en gardant le lien entre objectifs, contenus et activités à conduire en classe.",
  },
  {
    title: "Pilotage et évaluation continue",
    text: "Générez ensuite vos fiches, tenez le cahier journal, renseignez le registre de présence et suivez les résultats pour produire des bulletins lisibles et exploitables.",
  },
];

const STACK_BADGES = ["Fiches guidées", "Planification mensuelle", "Suivi de classe", "Bulletins"];

const PRODUCT_STATS = [
  { value: "24", label: "fichiers du référentiel traités" },
  { value: "929", label: "objectifs spécifiques indexés" },
  { value: "2036", label: "contenus pédagogiques exploitables" },
  { value: "6", label: "niveaux du CI au CM2" },
];

const READ_ME_CREDIBILITY = [
  {
    title: "Programme officiel organisé",
    text: "Le contenu du CI au CM2 est déjà structuré pour vous aider à préparer plus vite vos activités, sans recopier les guides à la main.",
    icon: BookMarked,
  },
  {
    title: "Données déjà intégrées",
    text: "Les contenus utiles sont déjà intégrés dans la plateforme: vous sélectionnez, vous adaptez, vous avancez.",
    icon: Layers,
  },
  {
    title: "Références au guide officiel",
    text: "Les guides sont incorporés avec leurs repères pour vous permettre de vérifier facilement la source et la position dans le document officiel.",
    icon: ShieldCheck,
  },
  {
    title: "Usage simple au quotidien",
    text: "L’outil fonctionne sur téléphone et ordinateur, et facilite l’impression, le suivi et l’archivage des documents utiles.",
    icon: BookOpenCheck,
  },
];

const FEATURES = [
  {
    eyebrow: "Production quotidienne",
    title: "Créer des fiches pédagogiques rapidement, plusieurs fois par jour.",
    text: "École 2.0 réduit le temps de rédaction répétitive en proposant un cadre guidé pour produire des fiches conformes, claires et immédiatement réutilisables.",
    bullets: ["Fiches prêtes à adapter", "Réduction des re-saisies", "Contenus déjà intégrés"],
    icon: ClipboardCheck,
  },
  {
    eyebrow: "Planification pédagogique",
    title: "Construire des planifications mensuelles cohérentes.",
    text: "La plateforme aligne le programme officiel et les progressions mensuelles pour mieux préparer la classe, sans devoir parcourir ou recopier les contenus depuis des documents externes. Après planification, chaque séance peut servir directement à générer sa fiche.",
    bullets: ["Vue mensuelle claire", "Liaison objectifs-activités", "Génération de fiche depuis la séance"],
    icon: CalendarDays,
  },
  {
    eyebrow: "Cahier journal & registre",
    title: "Tenir le cahier journal et le registre de classe en continu.",
    text: "Renseignez les activités, marquez les présences, absences et retards, puis conservez une trace propre et consultable du fonctionnement de la classe.",
    bullets: ["Présent / absent / retard", "Cahier journal numérique", "Traçabilité quotidienne"],
    icon: NotebookPen,
  },
  {
    eyebrow: "Suivi, évaluation, bulletins",
    title: "Suivre les apprentissages et générer des bulletins fiables.",
    text: "Regroupez les évaluations, visualisez la progression des élèves et produisez des bulletins clairs sans multiplier les fichiers ou les supports parallèles.",
    bullets: ["Saisie des évaluations", "Suivi individuel et classe", "Génération de bulletins"],
    icon: ChartColumnBig,
  },
];

const TRUST_POINTS = [
  "Référentiel primaire CI-CM2 structuré pour les usages quotidiens",
  "Exports propres pour les besoins administratifs, journaux et bulletins",
  "Expérience mobile pensée pour les réalités de terrain au Sénégal",
  "Archivage centralisé des documents utiles au travail de classe",
];

const HOME_ADVANTAGES = [
  { icon: TimerReset, text: "Réduction concrète du temps hors classe" },
  { icon: UserCheck, text: "Un espace pensé d’abord pour l’enseignant" },
  { icon: FileCheck2, text: "Documents propres et exploitables immédiatement" },
  { icon: Fingerprint, text: "Traçabilité administrative et pédagogique continue" },
];

function Brand() {
  return (
    <Link className="landing-brand" to="/">
      <span className="landing-brand-badge" aria-hidden="true">
        <GraduationCap size={20} />
      </span>
      <span>
        <strong>École 2.0</strong>
        <small>Plateforme EdTech primaire</small>
      </span>
    </Link>
  );
}

function MainCta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`landing-cta-row${compact ? " compact" : ""}`}>
      <Link className="landing-btn landing-btn-primary" to="/login">
        Libérer mon temps maintenant
        <ArrowRight size={16} />
      </Link>
      <Link className="landing-btn landing-btn-secondary" to="/demo">
        Regarder une démo
        <PlayCircle size={16} />
      </Link>
      <Link className="landing-btn landing-btn-tertiary" to="/fonctionnalites">
        Découvrir les fonctionnalités
      </Link>
    </div>
  );
}

function MarketingShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="landing-container landing-header-row">
          <Brand />

          <button
            className="landing-menu-btn"
            type="button"
            aria-label={menuOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <nav className={`landing-nav ${menuOpen ? "open" : ""}`}>
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `landing-nav-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
            <Link className="landing-btn landing-btn-login" to="/login" onClick={() => setMenuOpen(false)}>
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div>
            <h3>École 2.0</h3>
            <p>
              Une suite métier pour l’enseignement élémentaire, alignée sur les usages de terrain, les attentes institutionnelles et la formalisation attendue dans les écoles du Sénégal.
            </p>
            <div className="landing-footer-tags">
              <span>Fiches quotidiennes</span>
              <span>Planification mensuelle</span>
              <span>Cahier journal & registre</span>
              <span>Évaluation & bulletins</span>
            </div>
            <div className="landing-footer-stack">
              {STACK_BADGES.map((badge) => (
                <small key={badge}>{badge}</small>
              ))}
            </div>
          </div>
          <div>
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/fonctionnalites">Fonctionnalités</Link></li>
              <li><Link to="/demo">Démonstration</Link></li>
              <li><Link to="/login">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4>Crédibilité métier</h4>
            <p>
              Une présentation institutionnelle inspirée des codes visuels de l’État du Sénégal, du drapeau national et de l’univers du Ministère de l’Éducation nationale.
            </p>
          </div>
        </div>
        <div className="landing-container landing-footer-bottom">
          <p>Conçu pour soutenir le travail enseignant quotidien et le pilotage pédagogique de l’établissement.</p>
          <p>République du Sénégal · Éducation · Service aux enseignants</p>
        </div>
      </footer>

      <a className="landing-back-to-top" href="#top" aria-label="Retour en haut">
        <ArrowUp size={16} />
      </a>
    </div>
  );
}

export function MarketingHomePage() {
  return (
    <MarketingShell>
      <main className="landing-main" id="top">
        <section className="landing-hero landing-container">
          <div className="landing-animate">
            <p className="landing-kicker">
              <Sparkles size={14} />
              Pensé pour les enseignants du CI au CM2 au Sénégal
            </p>
            <h1>
              Offrir aux enseignants un environnement numérique à la hauteur des exigences de l’école primaire sénégalaise.
            </h1>
            <p className="landing-lead">
              Planifiez d’abord les apprentissages du mois, générez ensuite vos fiches à partir des séances prévues ou via le bouton Nouvelle fiche, puis renseignez votre cahier journal, le registre des présences et le suivi des évaluations jusqu’aux bulletins et propositions de passage.
            </p>
            <MainCta />

            <div className="landing-home-advantages" aria-label="Avantages clés">
              {HOME_ADVANTAGES.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="landing-home-adv-item">
                    <Icon size={14} />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="landing-hero-panel landing-animate">
            <h2>Ce que l’enseignant active immédiatement</h2>
            <ul>
              <li><CheckCircle2 size={16} /> Planification mensuelle alignée au programme</li>
              <li><CheckCircle2 size={16} /> Génération de fiches depuis chaque séance planifiée</li>
              <li><CheckCircle2 size={16} /> Bouton Nouvelle fiche pour créer une fiche indépendante</li>
            </ul>
            <p>
              Un environnement unique qui limite les doubles saisies et rend le travail pédagogique plus fluide, plus lisible et plus rapide au quotidien.
            </p>
          </aside>
        </section>

        <section className="landing-container landing-trust-strip" aria-label="Repères de crédibilité">
          {TRUST_POINTS.map((item) => (
            <div key={item} className="landing-trust-item">
              <CheckCircle2 size={15} />
              <span>{item}</span>
            </div>
          ))}
        </section>

        <section className="landing-container landing-stats-grid" aria-label="Indicateurs produit">
          {PRODUCT_STATS.map((item) => (
            <article key={item.label} className="landing-stat-card">
              <p>{item.value}</p>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <div className="landing-container">
          <div className="landing-tricolor-divider" aria-hidden="true" />
        </div>

        <section className="landing-container landing-pillars">
          <div className="landing-section-head">
            <p>Les 3 piliers</p>
            <h2>Une suite conçue pour les réalités pédagogiques et administratives des classes au Sénégal.</h2>
          </div>

          <div className="landing-pillar-grid">
            {PILLARS.map((item, index) => (
              <article key={item.title} className="landing-card lift">
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

export function MarketingFeaturesPage() {
  return (
    <MarketingShell>
      <main className="landing-main landing-main-tight">
        <section className="landing-container landing-intro">
          <p>Fonctionnalités</p>
          <h1>Des outils métier pensés pour l’école primaire et ses obligations de suivi.</h1>
          <p>
            École 2.0 réunit dans un même espace la préparation des fiches, la planification, le suivi de la classe
            et les documents administratifs, avec une prise en main simple pour les enseignants. Les contenus des guides officiels sont déjà intégrés: il ne reste plus qu’à sélectionner les bonnes données au lieu de les ressaisir.
          </p>
        </section>

        <section className="landing-container landing-proof-grid" aria-label="Repères de confiance pour les enseignants">
          {READ_ME_CREDIBILITY.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="landing-proof-card lift">
                <div className="landing-proof-icon" aria-hidden="true">
                  <Icon size={18} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="landing-container landing-feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="landing-feature-card landing-tricolor-outline lift">
              <div>
                <div className="landing-feature-icon" aria-hidden="true">
                  <feature.icon size={18} />
                </div>
                <p>{feature.eyebrow}</p>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </div>
              <div>
                {feature.bullets.map((bullet) => (
                  <div key={bullet} className="landing-feature-bullet">
                    <BookOpenCheck size={16} />
                    {bullet}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <div className="landing-container">
          <div className="landing-tricolor-divider" aria-hidden="true" />
        </div>

        <section className="landing-container landing-demo-cta landing-tricolor-outline">
          <p>Démonstration</p>
          <h2>Voyez École 2.0 en action dans un scénario d’usage réaliste.</h2>
          <p>
            Regardez un parcours type: planification mensuelle, génération de fiche depuis une séance prévue ou via Nouvelle fiche, tenue du registre et génération des bulletins, avec des contenus déjà intégrés et des repères issus du guide officiel.
          </p>
          <MainCta compact />
        </section>
      </main>
    </MarketingShell>
  );
}

export function MarketingDemoPage() {
  return (
    <MarketingShell>
      <main className="landing-main landing-main-tight">
        <section className="landing-container landing-intro">
          <p>Démonstration produit</p>
          <h1>Le parcours type d’un enseignant, du programme officiel au suivi des apprentissages.</h1>
          <p>
            Cette zone accueille votre vidéo produit. Le conteneur conserve un rendu institutionnel inspiré de l’identité visuelle de l’État du Sénégal en attendant l’intégration du lecteur final.
          </p>
        </section>

        <section className="landing-container landing-video-block">
          <div className="landing-video-placeholder landing-tricolor-outline">
            <PlayCircle size={72} />
            <h2>Lecteur de démonstration produit</h2>
            <p>Préparer une séance, suivre la classe et produire les documents essentiels dans une continuité de service claire, professionnelle et adaptée au contexte sénégalais.</p>
          </div>
        </section>

        <div className="landing-container">
          <div className="landing-tricolor-divider" aria-hidden="true" />
        </div>

        <section className="landing-container landing-convert landing-tricolor-outline">
          <div>
            <h2>Prêt à passer à l’usage réel ?</h2>
            <p>Accédez à votre portail enseignant et poursuivez le travail dans un environnement déjà structuré pour vos fiches, vos planifications et vos suivis de classe.</p>
          </div>
          <MainCta compact />
        </section>
      </main>
    </MarketingShell>
  );
}