import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate }                 from "react-router";
import { useQuery }                    from "@tanstack/react-query";
import { useProfileGuard }             from "../../hooks/useProfileGuard";
import { ProfileGuardLoader }          from "./ProfileGuardLoader";
import { ChevronLeft, ChevronDown, ChevronRight, Info, HelpCircle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { programmeNavFunctionApi }     from "../../services/programmeNavFunctionApi";
import { QK }                          from "../../lib/queryClient";

// ─── APC Data ─────────────────────────────────────────────────────────────────

const NIVEAUX = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

const DOMAINES = [
  "Langue et Communication",
  "Mathématiques",
  "ESVS",
  "EPSA",
];

// Domaines for which the Sous-domaine field must be disabled
const DOMAINES_SANS_SOUS_DOMAINE = new Set(["Mathématiques"]);

const SOUS_DOMAINES: Record<string, string[]> = {
  "Langue et Communication": ["Communication Orale", "Communication Écrite"],
  "Mathématiques": [],
  "ESVS": ["Découverte du monde", "Éducation au Développement Durable"],
  "EPSA": ["Éducation Physique et Sportive", "Éducation Artistique"],
};

// When a domaine has NO sous-domaine, disciplines come from this map keyed by domaine.
// When a domaine HAS a sous-domaine, disciplines come from this map keyed by sous-domaine.
const DISCIPLINES_BY_SOUS_DOMAINE: Record<string, string[]> = {
  // Langue et Communication — same list regardless of oral/écrite
  "Communication Orale":              ["Expression orale", "Récitation"],
  "Communication Écrite":             ["Lecture", "Production d'écrits", "Grammaire", "Vocabulaire", "Conjugaison", "Orthographe"],
  // ESVS — sub-domain drives a completely different discipline set
  "Découverte du monde":              ["Histoire", "Géographie", "IST (Initiation à la Science et à la Technologie)"],
  "Éducation au Développement Durable": ["Vivre ensemble", "Vivre dans son milieu"],
  // EPSA — sub-domain drives discipline set
  "Éducation Physique et Sportive":   ["EPS"],
  "Éducation Artistique":             ["Arts plastiques", "Éducation musicale", "Arts scéniques"],
};

// Mathématiques disciplines are keyed by domaine (no sous-domaine)
const DISCIPLINES_BY_DOMAINE: Record<string, string[]> = {
  "Mathématiques": ["Activités numériques", "Activités géométriques", "Activités de mesure", "Résolution de problèmes"],
};

const COMPETENCES: Record<string, string> = {
  // Langue et Communication
  "Expression orale":       "CB1 · L'élève s'exprime oralement de façon claire et structurée dans des situations de communication variées de la vie scolaire et sociale.",
  "Récitation":             "CB1 · L'élève mémorise et restitue des textes poétiques ou littéraires en respectant le rythme, l'intonation et l'expressivité.",
  "Lecture":                "CB1 · L'élève lit des textes variés avec fluidité et en comprend le sens global en mobilisant des stratégies de lecture efficaces.",
  "Production d'écrits":    "CB2 · L'élève produit des textes cohérents et structurés en respectant les normes de la communication écrite en français.",
  "Grammaire":              "CB1 · L'élève traite des situations de communication en utilisant les structures grammaticales de la langue française dans le respect des normes syntaxiques.",
  "Vocabulaire":            "CB1 · L'élève enrichit et mobilise son capital lexical pour comprendre et produire des messages adaptés à diverses situations de communication.",
  "Conjugaison":            "CB1 · L'élève produit des énoncés corrects en conjuguant les verbes aux temps et modes adaptés à la situation de communication.",
  "Orthographe":            "CB1 · L'élève écrit correctement les mots en appliquant les règles orthographiques d'usage et grammaticales de la langue française.",
  // Mathématiques
  "Activités numériques":         "CB1 · L'élève résout des situations-problèmes numériques liées à la vie courante en mobilisant des compétences en numération et calcul dans le système décimal.",
  "Activités géométriques":       "CB2 · L'élève résout des problèmes géométriques en identifiant, décrivant et construisant des figures planes et des solides de l'espace.",
  "Activités de mesure":          "CB3 · L'élève résout des situations de mesure de longueurs, masses, contenances et durées en choisissant les unités et instruments adaptés.",
  "Résolution de problèmes":      "CB4 · L'élève résout des problèmes de la vie courante en mobilisant et en combinant des compétences mathématiques dans une démarche de raisonnement structurée.",
  // ESVS — Découverte du monde
  "Histoire":               "CB1 · L'élève situe dans le temps des faits et événements historiques majeurs liés au Sénégal et à l'Afrique de l'Ouest en utilisant des repères chronologiques.",
  "Géographie":             "CB1 · L'élève situe dans l'espace des réalités géographiques locales, nationales et régionales en utilisant des représentations cartographiques adaptées.",
  "IST (Initiation à la Science et à la Technologie)": "CB2 · L'élève explique des phénomènes naturels et des faits scientifiques en mobilisant une démarche d'observation, d'investigation et d'expérimentation.",
  // ESVS — Développement Durable
  "Vivre ensemble":         "CB3 · L'élève adopte des comportements citoyens et solidaires en comprenant ses droits, devoirs et responsabilités au sein de la communauté.",
  "Vivre dans son milieu":  "CB3 · L'élève agit de façon responsable sur son environnement naturel et social en développant des attitudes favorables au développement durable.",
  // EPSA
  "EPS":                    "CB1 · L'élève développe ses capacités motrices, physiques et sportives en pratiquant des activités physiques dans le respect des règles et des valeurs du sport.",
  "Arts plastiques":        "CB1 · L'élève exprime sa sensibilité et sa créativité à travers des productions plastiques en utilisant des techniques, des matériaux et des outils variés.",
  "Éducation musicale":     "CB1 · L'élève développe ses capacités musicales en pratiquant le chant choral, l'écoute musicale et les activités rythmiques dans des contextes culturels variés.",
  "Arts scéniques":         "CB2 · L'élève s'exprime et communique à travers le jeu dramatique, la danse et les arts de la scène en développant sa créativité et sa confiance en soi.",
};

const PALIERS = ["Palier 1", "Palier 2", "Palier 3"];

interface OAEntry { oa: string; os: string[] }

const OBJECTIFS: Record<string, OAEntry[]> = {
  "Grammaire": [
    { oa: "OA1 · Identifier et classer les différentes classes de mots dans la phrase.", os: ["OS1.1 · Reconnaître les noms communs et noms propres", "OS1.2 · Identifier les déterminants articles définis et indéfinis", "OS1.3 · Classer les adjectifs qualificatifs épithètes"] },
    { oa: "OA2 · Analyser la structure syntaxique d'une phrase simple.", os: ["OS2.1 · Identifier le sujet et le groupe verbal", "OS2.2 · Distinguer le complément d'objet direct (COD)", "OS2.3 · Reconnaître les compléments circonstanciels de lieu et de temps"] },
  ],
  "Vocabulaire": [
    { oa: "OA1 · Identifier et utiliser les relations sémantiques entre les mots.", os: ["OS1.1 · Trouver le synonyme d'un mot donné dans un contexte", "OS1.2 · Identifier l'antonyme d'un adjectif ou d'un verbe", "OS1.3 · Constituer la famille lexicale d'un mot de base"] },
  ],
  "Conjugaison": [
    { oa: "OA1 · Conjuguer les verbes du 1er groupe au présent de l'indicatif.", os: ["OS1.1 · Identifier le radical et la terminaison d'un verbe", "OS1.2 · Conjuguer avec le pronom sujet correct", "OS1.3 · Produire des phrases correctement accordées"] },
    { oa: "OA2 · Conjuguer les verbes au passé composé avec l'auxiliaire avoir.", os: ["OS2.1 · Identifier l'auxiliaire avoir au présent", "OS2.2 · Former le participe passé des verbes du 1er groupe", "OS2.3 · Construire une phrase au passé composé"] },
  ],
  "Orthographe": [
    { oa: "OA1 · Appliquer les règles d'accord en genre et en nombre.", os: ["OS1.1 · Accorder l'adjectif avec le nom en genre", "OS1.2 · Mettre le groupe nominal au pluriel", "OS1.3 · Accorder le verbe avec son sujet au présent"] },
  ],
  "Lecture": [
    { oa: "OA1 · Lire un texte court avec fluidité et compréhension.", os: ["OS1.1 · Lire les syllabes et les mots avec exactitude", "OS1.2 · Lire un texte à voix haute avec la bonne intonation", "OS1.3 · Répondre à des questions de compréhension littérale"] },
  ],
  "Production d'écrits": [
    { oa: "OA1 · Produire un texte narratif court structuré.", os: ["OS1.1 · Rédiger une phrase à partir d'une image", "OS1.2 · Organiser des phrases en un paragraphe cohérent", "OS1.3 · Utiliser les connecteurs logiques : d'abord, ensuite, enfin"] },
  ],
  "Activités numériques": [
    { oa: "OA1 · Reconnaître, lire et écrire les nombres jusqu'à 1 000.", os: ["OS1.1 · Lire et écrire les nombres de 0 à 100", "OS1.2 · Décomposer les nombres en centaines, dizaines et unités", "OS1.3 · Comparer et ordonner des nombres"] },
    { oa: "OA2 · Effectuer des opérations arithmétiques sur les entiers.", os: ["OS2.1 · Calculer des additions avec retenue", "OS2.2 · Effectuer des soustractions avec emprunt", "OS2.3 · Résoudre des problèmes de monnaie CFA"] },
  ],
  "Activités géométriques": [
    { oa: "OA1 · Identifier et décrire les figures planes usuelles.", os: ["OS1.1 · Reconnaître et nommer le carré, le rectangle et le triangle", "OS1.2 · Identifier les côtés et les angles d'une figure", "OS1.3 · Tracer une figure plane à la règle et à l'équerre"] },
  ],
  "Activités de mesure": [
    { oa: "OA1 · Mesurer des longueurs avec les unités appropriées.", os: ["OS1.1 · Utiliser la règle graduée pour mesurer un segment", "OS1.2 · Convertir des longueurs : m, dm, cm et mm", "OS1.3 · Résoudre un problème de mesure de longueur"] },
  ],
  "Résolution de problèmes": [
    { oa: "OA1 · Résoudre un problème additif ou soustractif à une étape.", os: ["OS1.1 · Identifier les données utiles d'un problème", "OS1.2 · Choisir l'opération appropriée à la situation", "OS1.3 · Rédiger la réponse en phrase complète"] },
  ],
  "Histoire": [
    { oa: "OA1 · Situer des faits historiques sur une frise chronologique.", os: ["OS1.1 · Nommer des événements clés de l'histoire du Sénégal", "OS1.2 · Placer un événement avant ou après un autre", "OS1.3 · Identifier les acteurs principaux d'un fait historique"] },
  ],
  "Géographie": [
    { oa: "OA1 · Localiser les repères géographiques du Sénégal.", os: ["OS1.1 · Nommer les fleuves principaux du Sénégal", "OS1.2 · Identifier les régions administratives sur une carte", "OS1.3 · Localiser Dakar et les grandes villes"] },
  ],
  "IST (Initiation à la Science et à la Technologie)": [
    { oa: "OA1 · Observer et décrire un phénomène naturel simple.", os: ["OS1.1 · Formuler une hypothèse à partir d'une observation", "OS1.2 · Réaliser une expérience simple et noter les résultats", "OS1.3 · Conclure à partir des résultats obtenus"] },
  ],
  "Vivre ensemble": [
    { oa: "OA1 · Identifier les règles de vie collective à l'école.", os: ["OS1.1 · Nommer les droits et devoirs de l'élève", "OS1.2 · Donner des exemples de comportements solidaires", "OS1.3 · Expliquer l'importance du respect mutuel"] },
  ],
  "Vivre dans son milieu": [
    { oa: "OA1 · Décrire les actions responsables envers l'environnement.", os: ["OS1.1 · Identifier les sources de pollution dans son quartier", "OS1.2 · Proposer des gestes éco-responsables au quotidien", "OS1.3 · Expliquer l'importance de la préservation des arbres"] },
  ],
};

// ─── CONTENUS_BY_OS — strict parent-child mapping (OS → its exact contenus) ──
// Each key is the exact OS string from OBJECTIFS. Selecting an OS reveals ONLY
// these contenus — no cross-contamination from other OS entries.

const CONTENUS_BY_OS: Record<string, string[]> = {
  // ── GRAMMAIRE ─────────────────────────────────────────────────────────────
  "OS1.1 · Reconnaître les noms communs et noms propres": [
    "Les noms communs : définition et exemples",
    "Les noms propres : personnes, lieux, pays",
    "Distinction nom commun / nom propre dans une phrase",
  ],
  "OS1.2 · Identifier les déterminants articles définis et indéfinis": [
    "Les articles définis : le, la, les",
    "Les articles indéfinis : un, une, des",
    "La contraction de l'article : au, aux, du, des",
  ],
  "OS1.3 · Classer les adjectifs qualificatifs épithètes": [
    "L'adjectif qualificatif épithète : définition et rôle",
    "L'accord de l'adjectif en genre et en nombre",
    "La place de l'adjectif épithète dans le groupe nominal",
  ],
  "OS2.1 · Identifier le sujet et le groupe verbal": [
    "Le sujet : qui fait l'action ?",
    "Le groupe verbal : le verbe et ses compléments essentiels",
    "L'accord du verbe avec son sujet",
  ],
  "OS2.2 · Distinguer le complément d'objet direct (COD)": [
    "Le COD : définition et identification dans la phrase",
    "Le COD répond aux questions : quoi ? / qui ?",
    "La pronominalisation du COD : le, la, les",
  ],
  "OS2.3 · Reconnaître les compléments circonstanciels de lieu et de temps": [
    "Le complément circonstanciel de lieu (CCL) : où ?",
    "Le complément circonstanciel de temps (CCT) : quand ?",
    "Distinction CCL et CCT dans la phrase complexe",
  ],
  // ── VOCABULAIRE ──────────────────────────────────────────────────────────
  "OS1.1 · Trouver le synonyme d'un mot donné dans un contexte": [
    "Les synonymes : mots de sens proche",
    "Choisir le synonyme approprié selon le contexte",
    "L'utilisation des synonymes pour enrichir l'écrit",
  ],
  "OS1.2 · Identifier l'antonyme d'un adjectif ou d'un verbe": [
    "Les antonymes : mots de sens contraire",
    "Les préfixes négatifs : in-, im-, il-, ir-, dés-",
    "Les antonymes courants des adjectifs qualificatifs",
  ],
  "OS1.3 · Constituer la famille lexicale d'un mot de base": [
    "Le radical commun d'une famille de mots",
    "Les dérivés : préfixes et suffixes courants",
    "Construction de familles lexicales autour d'un thème",
  ],
  // ── CONJUGAISON ──────────────────────────────────────────────────────────
  "OS1.1 · Identifier le radical et la terminaison d'un verbe": [
    "Le radical : la partie invariable du verbe",
    "La terminaison (désinence) selon le temps et la personne",
    "Les verbes du 1er groupe : infinitif en -er",
  ],
  "OS1.2 · Conjuguer avec le pronom sujet correct": [
    "Les pronoms personnels sujets : je, tu, il/elle, nous, vous, ils/elles",
    "L'accord du verbe avec le pronom sujet au présent",
    "Conjugaison au présent : verbes du 1er groupe",
  ],
  "OS1.3 · Produire des phrases correctement accordées": [
    "Vérification de l'accord sujet-verbe au présent",
    "Production de phrases variées avec différents pronoms",
    "Correction d'erreurs d'accord dans un texte",
  ],
  "OS2.1 · Identifier l'auxiliaire avoir au présent": [
    "L'auxiliaire avoir au présent : j'ai, tu as, il a…",
    "Distinction avoir (auxiliaire) / avoir (verbe d'état)",
    "Utilisation de l'auxiliaire avoir dans la phrase",
  ],
  "OS2.2 · Former le participe passé des verbes du 1er groupe": [
    "La formation du participe passé : radical + -é",
    "Le participe passé des verbes irréguliers courants",
    "L'accord du participe passé avec l'auxiliaire avoir",
  ],
  "OS2.3 · Construire une phrase au passé composé": [
    "La structure : auxiliaire avoir/être + participe passé",
    "Le passé composé pour exprimer une action terminée",
    "Production de phrases au passé composé à partir d'images",
  ],
  // ── ORTHOGRAPHE ───────────────────────────────────────────────────────────
  "OS1.1 · Accorder l'adjectif avec le nom en genre": [
    "L'accord de l'adjectif qualificatif : masculin / féminin",
    "Les terminaisons féminines : -e, -ère, -euse, -ive",
    "Les adjectifs dont la forme féminine est irrégulière",
  ],
  "OS1.2 · Mettre le groupe nominal au pluriel": [
    "Le pluriel des noms : règle générale (-s)",
    "Les pluriels irréguliers : -aux, -eaux, -eux",
    "L'accord de l'adjectif qualificatif en nombre (-s)",
  ],
  "OS1.3 · Accorder le verbe avec son sujet au présent": [
    "L'accord sujet-verbe au présent de l'indicatif",
    "L'accord avec des sujets coordonnés par et",
    "Cas particuliers : sujets éloignés du verbe",
  ],
  // ── LECTURE ───────────────────────────────────────────────────────────────
  "OS1.1 · Lire les syllabes et les mots avec exactitude": [
    "La lecture de syllabes simples (CV, CVC)",
    "La lecture de mots bi- et trisyllabiques",
    "La lecture de mots avec consonnes groupées (bl, cr, tr…)",
  ],
  "OS1.2 · Lire un texte à voix haute avec la bonne intonation": [
    "L'intonation déclarative : la phrase affirmative",
    "L'intonation interrogative : la phrase question",
    "L'intonation exclamative : la phrase exclamative",
  ],
  "OS1.3 · Répondre à des questions de compréhension littérale": [
    "Identifier les personnages d'un texte narratif",
    "Repérer le lieu et le temps de l'action",
    "Trouver les informations explicites dans un texte",
  ],
  // ── PRODUCTION D'ÉCRITS ───────────────────────────────────────────────────
  "OS1.1 · Rédiger une phrase à partir d'une image": [
    "Observer une image et identifier ses éléments principaux",
    "Rédiger une phrase simple : sujet + verbe + complément",
    "Enrichir une phrase simple avec des compléments",
  ],
  "OS1.2 · Organiser des phrases en un paragraphe cohérent": [
    "La cohérence textuelle : liens entre les phrases",
    "L'utilisation des pronoms de substitution",
    "La construction d'un paragraphe descriptif ou narratif",
  ],
  "OS1.3 · Utiliser les connecteurs logiques : d'abord, ensuite, enfin": [
    "Les connecteurs temporels : d'abord, ensuite, puis, enfin",
    "Les connecteurs causaux : parce que, car, puisque",
    "Structuration d'un texte avec des connecteurs logiques",
  ],
  // ── EXPRESSION ORALE ──────────────────────────────────────────────────────
  "OS1.1 · Se présenter oralement en utilisant le vocabulaire approprié": [
    "La présentation personnelle : nom, prénom, école, classe",
    "Le vocabulaire de la famille et de l'entourage proche",
    "La description physique simple : taille, couleur des yeux",
  ],
  "OS1.2 · Décrire un objet ou une scène avec précision": [
    "Le vocabulaire de la description : couleur, forme, taille",
    "La description orale d'une image documentaire",
    "La description d'une scène de vie quotidienne",
  ],
  // ── RÉCITATION ────────────────────────────────────────────────────────────
  "OS1.1 · Mémoriser un texte poétique de 4 à 8 vers": [
    "Lecture et compréhension du poème en classe",
    "Mémorisation progressive : vers par vers",
    "Récitation avec l'intonation et le rythme adaptés",
  ],
  // ── ACTIVITÉS NUMÉRIQUES ──────────────────────────────────────────────────
  "OS1.1 · Lire et écrire les nombres de 0 à 100": [
    "Lecture et écriture des nombres de 0 à 20",
    "Lecture et écriture des nombres de 21 à 69",
    "Lecture et écriture des nombres de 70 à 100",
  ],
  "OS1.2 · Décomposer les nombres en centaines, dizaines et unités": [
    "Décomposition additive d'un nombre à 2 chiffres",
    "Décomposition d'un nombre à 3 chiffres",
    "Le tableau de numération : centaines, dizaines, unités",
  ],
  "OS1.3 · Comparer et ordonner des nombres": [
    "La comparaison de deux nombres : <, >, =",
    "Le rangement de nombres dans l'ordre croissant",
    "Le rangement de nombres dans l'ordre décroissant",
  ],
  "OS2.1 · Calculer des additions avec retenue": [
    "L'addition sans retenue — révision",
    "L'addition avec retenue sur les unités",
    "L'addition avec retenue sur les dizaines",
  ],
  "OS2.2 · Effectuer des soustractions avec emprunt": [
    "La soustraction sans emprunt — révision",
    "La soustraction avec emprunt sur les unités",
    "La soustraction avec emprunt sur les dizaines",
  ],
  "OS2.3 · Résoudre des problèmes de monnaie CFA": [
    "Les pièces de 50 F, 100 F et 250 F CFA",
    "Les billets de 500 F et 1 000 F CFA",
    "Les opérations de rendu de monnaie",
  ],
  // ── ACTIVITÉS GÉOMÉTRIQUES ────────────────────────────────────────────────
  "OS1.1 · Reconnaître et nommer le carré, le rectangle et le triangle": [
    "Le carré : définition, 4 côtés égaux et 4 angles droits",
    "Le rectangle : définition, côtés opposés égaux",
    "Le triangle : définition et ses différentes formes",
  ],
  "OS1.2 · Identifier les côtés et les angles d'une figure": [
    "Les côtés d'une figure plane : définition et mesure",
    "L'angle droit : identification avec l'équerre",
    "Les sommets d'une figure plane",
  ],
  "OS1.3 · Tracer une figure plane à la règle et à l'équerre": [
    "Tracer un carré de dimensions données à la règle",
    "Tracer un rectangle de dimensions données",
    "Vérification des angles droits à l'équerre",
  ],
  // ── ACTIVITÉS DE MESURE ───────────────────────────────────────────────────
  "OS1.1 · Utiliser la règle graduée pour mesurer un segment": [
    "La lecture de la règle graduée en cm et mm",
    "La mesure d'un segment en centimètres",
    "La comparaison de longueurs mesurées",
  ],
  "OS1.2 · Convertir des longueurs : m, dm, cm et mm": [
    "Les relations entre m, dm, cm et mm",
    "La conversion de mètres en centimètres",
    "La conversion de centimètres en millimètres",
  ],
  "OS1.3 · Résoudre un problème de mesure de longueur": [
    "Calcul du périmètre de figures simples",
    "Problèmes de comparaison de longueurs",
    "Problèmes de mesure de longueurs dans la vie courante",
  ],
  // ── RÉSOLUTION DE PROBLÈMES ───────────────────────────────────────────────
  "OS1.1 · Identifier les données utiles d'un problème": [
    "La lecture et la compréhension d'un problème",
    "L'identification des données connues et inconnues",
    "La distinction entre données utiles et parasites",
  ],
  "OS1.2 · Choisir l'opération appropriée à la situation": [
    "Problèmes additifs : réunion et transformation",
    "Problèmes soustractifs : retrait et comparaison",
    "Problèmes multiplicatifs : produit et partition",
  ],
  "OS1.3 · Rédiger la réponse en phrase complète": [
    "La rédaction de la démarche de résolution",
    "L'écriture de la réponse en phrase complète",
    "La vérification de la vraisemblance de la réponse",
  ],
  // ── HISTOIRE ──────────────────────────────────────────────────────────────
  "OS1.1 · Nommer des événements clés de l'histoire du Sénégal": [
    "L'indépendance du Sénégal : 4 avril 1960",
    "Le Royaume du Cayor et la résistance de Lat Dior",
    "L'Empire du Mali et la civilisation mandingue",
  ],
  "OS1.2 · Placer un événement avant ou après un autre": [
    "La frise chronologique : lecture et construction",
    "L'ordre chronologique des événements historiques",
    "La notion d'avant et d'après en histoire",
  ],
  "OS1.3 · Identifier les acteurs principaux d'un fait historique": [
    "Les personnages historiques : rois, résistants, colons",
    "Le rôle des griots dans la transmission de l'histoire orale",
    "Les ancêtres fondateurs des royaumes sénégalais",
  ],
  // ── GÉOGRAPHIE ────────────────────────────────────────────────────────────
  "OS1.1 · Nommer les fleuves principaux du Sénégal": [
    "Le Fleuve Sénégal : source, cours et embouchure",
    "Le Fleuve Gambie : bassin versant et importance",
    "La Casamance : fleuve et région naturelle",
  ],
  "OS1.2 · Identifier les régions administratives sur une carte": [
    "Les 14 régions administratives du Sénégal",
    "La lecture d'une carte administrative simple",
    "Les chefs-lieux des régions du Sénégal",
  ],
  "OS1.3 · Localiser Dakar et les grandes villes": [
    "Dakar : capitale et métropole du Sénégal",
    "Les grandes villes : Thiès, Kaolack, Saint-Louis, Ziguinchor",
    "Localisation des villes sur une carte muette",
  ],
  // ── IST ───────────────────────────────────────────────────────────────────
  "OS1.1 · Formuler une hypothèse à partir d'une observation": [
    "L'observation scientifique : les 5 sens",
    "La formulation d'une hypothèse simple",
    "La démarche expérimentale : observer → formuler → tester",
  ],
  "OS1.2 · Réaliser une expérience simple et noter les résultats": [
    "Les états de la matière : solide, liquide, gazeux",
    "La germination d'une graine : protocole et observations",
    "Le cycle de l'eau : évaporation et condensation",
  ],
  "OS1.3 · Conclure à partir des résultats obtenus": [
    "La rédaction d'une conclusion scientifique simple",
    "Vérification de l'hypothèse : confirmée ou infirmée",
    "Présentation orale des résultats d'une expérience",
  ],
  // ── VIVRE ENSEMBLE ────────────────────────────────────────────────────────
  "OS1.1 · Nommer les droits et devoirs de l'élève": [
    "Le droit à l'éducation : principes et garanties",
    "Les devoirs de l'élève : respect, ponctualité, travail",
    "Le règlement intérieur de l'école",
  ],
  "OS1.2 · Donner des exemples de comportements solidaires": [
    "La solidarité à l'école : entraide et coopération",
    "Le bénévolat et l'engagement communautaire",
    "La solidarité en cas de difficulté ou de catastrophe",
  ],
  "OS1.3 · Expliquer l'importance du respect mutuel": [
    "Le respect de l'autre : différences culturelles et religieuses",
    "La tolérance et la non-discrimination",
    "Le vivre-ensemble dans la société sénégalaise",
  ],
  // ── VIVRE DANS SON MILIEU ─────────────────────────────────────────────────
  "OS1.1 · Identifier les sources de pollution dans son quartier": [
    "Les déchets ménagers et leur impact sur l'environnement",
    "La pollution de l'air : fumées, poussières, brûlures",
    "La pollution de l'eau : canalisations et déversements",
  ],
  "OS1.2 · Proposer des gestes éco-responsables au quotidien": [
    "Le tri sélectif des déchets : recyclage et compostage",
    "Les économies d'eau et d'énergie à la maison",
    "La plantation d'arbres et le reboisement",
  ],
  "OS1.3 · Expliquer l'importance de la préservation des arbres": [
    "Le rôle des arbres dans l'écosystème",
    "La déforestation au Sénégal : causes et conséquences",
    "La Grande Muraille Verte : reboisement africain",
  ],
};

// ─── Per-chip cycling colour palette ─────────────────────────────────────────

interface ChipColor {
  bgOff: string; borderOff: string; textOff: string;
  bgOn:  string; borderOn:  string; textOn:  string; shadowOn: string;
}

// 8-stop curated cycle — vibrant but readable on white card background
const CHIP_COLORS: ChipColor[] = [
  { bgOff:"#fff1f2", borderOff:"#fecdd3", textOff:"#be123c", bgOn:"#e11d48", borderOn:"#e11d48", textOn:"#fff", shadowOn:"rgba(225,29,72,0.28)"   }, // Coral Red
  { bgOff:"#fffbeb", borderOff:"#fde68a", textOff:"#92400e", bgOn:"#d97706", borderOn:"#d97706", textOn:"#fff", shadowOn:"rgba(217,119,6,0.28)"    }, // Amber Gold
  { bgOff:"#f0fdfa", borderOff:"#99f6e4", textOff:"#0f766e", bgOn:"#0d9488", borderOn:"#0d9488", textOn:"#fff", shadowOn:"rgba(13,148,136,0.28)"   }, // Teal
  { bgOff:"#f5f3ff", borderOff:"#ddd6fe", textOff:"#6d28d9", bgOn:"#7c3aed", borderOn:"#7c3aed", textOn:"#fff", shadowOn:"rgba(124,58,237,0.28)"   }, // Violet
  { bgOff:"#eff6ff", borderOff:"#bfdbfe", textOff:"#1d4ed8", bgOn:"#2563eb", borderOn:"#2563eb", textOn:"#fff", shadowOn:"rgba(37,99,235,0.28)"    }, // Royal Blue
  { bgOff:"#ecfdf5", borderOff:"#a7f3d0", textOff:"#065f46", bgOn:"#059669", borderOn:"#059669", textOn:"#fff", shadowOn:"rgba(5,150,105,0.28)"    }, // Emerald
  { bgOff:"#fff7ed", borderOff:"#fed7aa", textOff:"#9a3412", bgOn:"#ea580c", borderOn:"#ea580c", textOn:"#fff", shadowOn:"rgba(234,88,12,0.28)"    }, // Orange
  { bgOff:"#fdf4ff", borderOff:"#f5d0fe", textOff:"#86198f", bgOn:"#a21caf", borderOn:"#a21caf", textOn:"#fff", shadowOn:"rgba(162,28,175,0.28)"   }, // Fuchsia
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ step, label, color = "var(--primary)" }: { step: string; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
        style={{ backgroundColor: color }}
      >
        {step}
      </div>
      <span className="text-[13px] font-bold text-primary uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-primary/10" />
    </div>
  );
}

function Dropdown({
  label, hint, value, onChange, options, placeholder,
  disabled, disabledReason, loading, id, name,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; options: string[];
  placeholder: string; disabled?: boolean; disabledReason?: string;
  loading?: boolean; id?: string; name?: string;
}) {
  const isLocked = disabled || loading;
  const filled   = !!value && !isLocked;
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '_');
  const fieldName = name || fieldId;

  return (
    <div className={`transition-opacity duration-200 ${isLocked && !loading ? "opacity-50" : "opacity-100"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin"/>}
          {hint && !loading && <span className="text-[10px] text-slate-600 dark:text-slate-300">{hint}</span>}
        </div>
      </div>
      <div className="relative">
        <select
          id={fieldId}
          name={fieldName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLocked}
          className={`w-full appearance-none rounded-xl px-4 py-3 pr-10 text-[13px] font-medium border-2 outline-none transition-all
            ${isLocked
              ? "bg-gray-50 border-gray-200 text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
              : filled
                ? "bg-accent border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary focus:border-primary cursor-pointer"
            }`}
            style={filled ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent)" } : {}}
        >
          <option value="">{loading ? "Mise à jour…" : placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading
            ? <Loader2 className="w-4 h-4 text-primary animate-spin"/>
            : <ChevronDown className={`w-4 h-4 transition-colors ${filled ? "text-primary" : "text-gray-300"}`}/>} 
        </span>
      </div>
      {disabled && !loading && disabledReason && (
        <p className="mt-1 text-[10px] text-amber-600 font-medium flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0"/>
          {disabledReason}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContextSelector() {
  const navigate          = useNavigate();
  const { loading, blocked, skip } = useProfileGuard();

  // Section A
  const [niveau,      setNiveau]      = useState("");
  const [domaine,     setDomaine]     = useState("");
  const [sousDomaine, setSousDomaine] = useState("");
  const [discipline,  setDiscipline]  = useState("");

  // Section B
  const [palier,       setPalier]       = useState("");
  const [oaIdx,        setOaIdx]        = useState<number | "">("");
  const [selectedOS,   setSelectedOS]   = useState("");

  // Section C
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const filtersQuery = useQuery({
    queryKey: QK.programmeNavFilters(),
    queryFn: async () => {
      const res = await programmeNavFunctionApi.getFilters();
      return res.data;
    },
  });

  const niveauxData = filtersQuery.data?.niveaux ?? [];
  const domainesData = filtersQuery.data?.domaines ?? [];
  const sousDomainesData = filtersQuery.data?.sous_domaines ?? [];

  const selectedNiveau = niveauxData.find((n) => n.nom === niveau);
  const selectedDomaine = domainesData.find((d) => d.nom === domaine && (!selectedNiveau || d.niveau_id === selectedNiveau.id));
  const selectedSousDomaine = sousDomainesData.find((s) => s.nom === sousDomaine && (!selectedDomaine || s.domaine_id === selectedDomaine.id));

  const programmeCurriculumQuery = useQuery({
    queryKey: [
      "programme-nav",
      "curriculum",
      selectedNiveau?.id ?? null,
      selectedDomaine?.id ?? null,
      selectedSousDomaine?.id ?? null,
      discipline || null,
    ] as const,
    queryFn: async () => {
      const res = await programmeNavFunctionApi.getCurriculumResolved({
        niveauId: selectedNiveau?.id,
        domaineId: selectedDomaine?.id,
        sousDomaineId: selectedSousDomaine?.id,
        activite: discipline || undefined,
      });
      return res.data;
    },
    enabled: Boolean(selectedNiveau && selectedDomaine),
  });

  const isMaths    = domaine === "Mathématiques";
  const sousOpts   = useMemo(() => {
    if (selectedDomaine) {
      return sousDomainesData
        .filter((s) => s.domaine_id === selectedDomaine.id)
        .map((s) => s.nom)
        .filter((s): s is string => Boolean(s));
    }
    return SOUS_DOMAINES[domaine] ?? [];
  }, [selectedDomaine, sousDomainesData, domaine]);

  // Discipline options depend on whether the domaine uses sous-domaine-level filtering
  const discOpts: string[] = programmeCurriculumQuery.data?.disciplines?.length
    ? programmeCurriculumQuery.data.disciplines
    : isMaths
      ? (DISCIPLINES_BY_DOMAINE[domaine] ?? [])
      : sousDomaine
        ? (DISCIPLINES_BY_SOUS_DOMAINE[sousDomaine] ?? [])
        : [];

  // For Langue et Communication with no sous-domaine yet, show all disciplines flat
  const allLangDisc = domaine === "Langue et Communication" && !sousDomaine
    ? Object.values(DISCIPLINES_BY_SOUS_DOMAINE).flat().filter((v, i, a) => a.indexOf(v) === i)
    : [];

  const effectiveDiscOpts = discOpts.length > 0 ? discOpts : allLangDisc;

  // ── Loading step tracker — shows spinner on the field being repopulated ──
  const [loadingStep, setLoadingStep] = useState<
    "sousDomaine"|"discipline"|"palier"|"oa"|"os"|"contenus"|null
  >(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const missingHintsRef = useRef<HTMLDivElement | null>(null);

  const [merged,      setMerged]      = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [showMissingHints, setShowMissingHints] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const curriculumDetail = programmeCurriculumQuery.data?.detail;

  const competence = curriculumDetail?.competence || COMPETENCES[discipline] || "";

  const paliersOpts = curriculumDetail?.paliers?.length
    ? curriculumDetail.paliers.map((p) => p.nom)
    : PALIERS;

  const oaList: OAEntry[] = useMemo(() => {
    if (!curriculumDetail) return OBJECTIFS[discipline] ?? [];
    const selectedPalier = curriculumDetail.paliers.find((p) => p.nom === palier);
    if (!selectedPalier) return [];
    return selectedPalier.oas.map((oa) => ({
      oa: oa.titre,
      os: oa.os.map((o) => o.titre),
    }));
  }, [curriculumDetail, discipline, palier]);

  const contenusByOs = useMemo(() => {
    const out: Record<string, string[]> = {};
    if (curriculumDetail) {
      for (const p of curriculumDetail.paliers) {
        for (const oa of p.oas) {
          for (const os of oa.os) {
            out[os.titre] = os.contenus;
          }
        }
      }
    }
    return out;
  }, [curriculumDetail]);

  const oaEntry    = oaIdx !== "" ? oaList[oaIdx] : undefined;
  const osOpts     = oaEntry?.os ?? [];

  // CORE FIX: contenus are now filtered strictly by the selected OS key.
  // If no OS is selected, the panier is empty — no orphan chips appear.
  const contenus = selectedOS
    ? (contenusByOs[selectedOS] ?? CONTENUS_BY_OS[selectedOS] ?? [])
    : [];

  const requiresSousDomaine = Boolean(domaine) && !isMaths && sousOpts.length > 0;
  const missingFields: string[] = [];

  if (!niveau) missingFields.push("Niveau");
  if (!domaine) missingFields.push("Domaine");
  if (requiresSousDomaine && !sousDomaine) missingFields.push("Sous-domaine");
  if (!discipline) missingFields.push("Discipline / Activité");
  if (!palier) missingFields.push("Palier");
  if (oaIdx === "") missingFields.push("Objectif d'apprentissage");
  if (!selectedOS) missingFields.push("Objectif spécifique");
  if (checked.size === 0) missingFields.push("Au moins un contenu");

  const canProceed = missingFields.length === 0;

  // progress
  const stepsA = [niveau, domaine, discipline].filter(Boolean).length;
  const stepsB = [palier, oaIdx !== "" ? "x" : "", selectedOS].filter(Boolean).length;
  const totalFilled = stepsA + stepsB + checked.size;
  const progressPct = Math.min(100, Math.round((totalFilled / (3 + 3 + 1)) * 100));

  // ── Cascade reset helpers ─────────────────────────────────────────────────
  // Each reset clears all downstream fields, then briefly shows a spinner on
  // the next field to signal that its list is being refreshed.

  function clearTimer() {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
  }

  function triggerLoad(step: typeof loadingStep, delayMs = 320) {
    clearTimer();
    setLoadingStep(step);
    loadTimerRef.current = setTimeout(() => setLoadingStep(null), delayMs);
  }

  function resetFrom(from: "domaine" | "sousDomaine" | "discipline" | "palier" | "oaIdx") {
    if (from === "domaine") {
      setSousDomaine(""); setDiscipline("");
      setPalier(""); setOaIdx(""); setSelectedOS(""); setChecked(new Set());
      triggerLoad("sousDomaine");
    } else if (from === "sousDomaine") {
      setDiscipline("");
      setPalier(""); setOaIdx(""); setSelectedOS(""); setChecked(new Set());
      triggerLoad("discipline");
    } else if (from === "discipline") {
      setPalier(""); setOaIdx(""); setSelectedOS(""); setChecked(new Set());
      triggerLoad("palier");
    } else if (from === "palier") {
      setOaIdx(""); setSelectedOS(""); setChecked(new Set());
      triggerLoad("oa");
    } else if (from === "oaIdx") {
      setSelectedOS(""); setChecked(new Set());
      triggerLoad("os");
    }
  }

  // When OS changes, clear the chip basket and briefly show a contenus spinner
  useEffect(() => {
    setChecked(new Set());
    if (selectedOS) triggerLoad("contenus", 280);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOS]);

  useEffect(() => {
    if (canProceed && showMissingHints) setShowMissingHints(false);
  }, [canProceed, showMissingHints]);

  useEffect(() => {
    if (!showMissingHints) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (missingHintsRef.current && !missingHintsRef.current.contains(target)) {
        setShowMissingHints(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showMissingHints]);

  function toggleCheck(c: string) {
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });
  }

  function handleNext() {
    if (!canProceed) {
      setShowMissingHints((prev) => !prev);
      return;
    }
    setShowMissingHints(false);
    navigate("/select-lesson", {
      state: { niveau, domaine, sousDomaine, discipline, palier,
               oa: oaEntry?.oa ?? "", os: selectedOS,
               contenus: [...checked], competence, merged },
    });
  }

  if (loading) return <ProfileGuardLoader loading />;
  if (blocked) return <ProfileGuardLoader blocked onSkip={skip} />;

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Mobile: max-w-md card. Desktop: wider container, no shadow */}
      <div className="max-w-md lg:max-w-4xl mx-auto bg-card min-h-screen shadow-2xl lg:shadow-none flex flex-col relative">

        {/* ── Sticky header ─────────────────────────────────── */}
        <div
          className="sticky top-0 z-20 overflow-hidden"
          style={{
            backgroundColor: "color-mix(in srgb, var(--card) 94%, var(--background) 6%)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "0 8px 24px color-mix(in srgb, var(--foreground) 10%, transparent)",
          }}
        >
          <div className="flex items-center gap-1 px-3 py-4 lg:px-6">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl transition-colors active:scale-95 shrink-0"
              style={{ backgroundColor: "var(--muted)" }}
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: "var(--foreground)" }} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                Nouvelle Fiche · Étape 1 sur 2
              </p>
              <h1 className="text-[16px] font-bold leading-tight truncate" style={{ color: "var(--foreground)" }}>
                Configuration APC
              </h1>
            </div>
            {/* Step badge */}
            <div className="shrink-0 flex flex-col items-center">
              <span className="text-[10px] font-semibold" style={{ color: "var(--muted-foreground)" }}>Cadrage</span>
              <div className="flex gap-1 mt-1">
                <span className="w-6 h-1.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                <span className="w-6 h-1.5 rounded-full" style={{ backgroundColor: "var(--muted)" }} />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1" style={{ backgroundColor: "var(--muted)" }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%`, backgroundColor: "var(--primary)" }}
            />
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-36 px-4 lg:px-6 pt-4 space-y-4">

          {/* Intro pill */}
          <div className="flex items-start gap-2.5 bg-accent border border-border rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-foreground text-[12px] lg:text-[13px] leading-relaxed">
              Aucune saisie manuelle — sélectionnez chaque paramètre dans l'ordre. Les listes sont issues du programme officiel DEMSG.
            </p>
          </div>

          {/* ══ DESKTOP: sections A + B side by side ══════════ */}
          {/* ══ MOBILE:  sections A + B stacked ══════════════ */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">

          {/* ══ SECTION A ═════════════════════════════════════ */}
          <div
            className="bg-card rounded-2xl p-5 mb-4 lg:mb-0"
            style={{ boxShadow: "0 2px 12px rgba(26,54,93,0.07), 0 1px 3px rgba(26,54,93,0.05)" }}
          >
            <SectionLabel step="A" label="Cadrage Institutionnel" />
            <div className="space-y-4">

              <Dropdown
                id="context_niveau"
                name="niveau"
                label="Niveau"
                value={niveau}
                onChange={(v) => { setNiveau(v); resetFrom("domaine"); setDomaine(""); }}
                options={niveauxData.length ? niveauxData.map((n) => n.nom) : NIVEAUX}
                placeholder="Sélectionner le niveau…"
              />

              <Dropdown
                id="context_domaine"
                name="domaine"
                label="Domaine"
                value={domaine}
                onChange={(v) => { setDomaine(v); resetFrom("domaine"); }}
                options={selectedNiveau
                  ? domainesData.filter((d) => d.niveau_id === selectedNiveau.id).map((d) => d.nom)
                  : DOMAINES}
                placeholder="Sélectionner le domaine…"
                disabled={!niveau}
                disabledReason="Sélectionnez d'abord un niveau."
                loading={loadingStep === "sousDomaine"}
              />

              <Dropdown
                id="context_sousDomaine"
                name="sousDomaine"
                label="Sous-domaine"
                hint="si applicable"
                value={sousDomaine}
                onChange={(v) => { setSousDomaine(v); resetFrom("sousDomaine"); }}
                options={sousOpts}
                placeholder={
                  DOMAINES_SANS_SOUS_DOMAINE.has(domaine)
                    ? "Non applicable — Mathématiques"
                    : "Sélectionner le sous-domaine…"
                }
                disabled={!domaine || DOMAINES_SANS_SOUS_DOMAINE.has(domaine)}
                disabledReason={
                  DOMAINES_SANS_SOUS_DOMAINE.has(domaine)
                    ? "Pas de sous-domaine pour les Mathématiques."
                    : undefined
                }
                loading={loadingStep === "discipline"}
              />

              <Dropdown
                id="context_discipline"
                name="discipline"
                label="Discipline / Activité"
                value={discipline}
                onChange={(v) => { setDiscipline(v); resetFrom("discipline"); }}
                options={effectiveDiscOpts}
                placeholder={
                  !domaine
                    ? "Sélectionner la discipline…"
                    : !isMaths && !sousDomaine && sousOpts.length > 0
                      ? "Sélectionnez d'abord un sous-domaine…"
                      : effectiveDiscOpts.length === 0
                        ? "Aucune discipline disponible"
                        : "Sélectionner la discipline…"
                }
                disabled={!domaine || (!isMaths && sousOpts.length > 0 && !sousDomaine)}
                disabledReason={
                  !isMaths && sousOpts.length > 0 && !sousDomaine
                    ? "Sélectionnez d'abord un sous-domaine."
                    : undefined
                }
                loading={loadingStep === "palier"}
              />
            </div>
          </div>

          {/* ══ SECTION B ═════════════════════════════════════ */}
          <div
            className={`bg-card rounded-2xl p-5 transition-all duration-300 mb-4 lg:mb-0 ${discipline ? "opacity-100" : "opacity-40 pointer-events-none"}`}
            style={{ boxShadow: "0 2px 12px rgba(26,54,93,0.07), 0 1px 3px rgba(26,54,93,0.05)" }}
          >
            <SectionLabel step="B" label="Alignement APC" />

            {/* Compétence de Base — read-only info box */}
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--foreground)" }}>
                Compétence de Base (CB)
              </p>
              <div
                className={`rounded-xl px-4 py-3 flex gap-2.5 transition-all duration-300 ${
                  competence
                    ? "bg-accent border-2 border-primary/30"
                    : "bg-gray-50 border-2 border-dashed border-gray-200"
                }`}
              >
                <Info className={`w-4 h-4 shrink-0 mt-0.5 ${competence ? "text-primary" : "text-gray-300"}`} />
                <p
                  className={`text-[12px] leading-relaxed ${
                    competence ? "text-foreground font-medium" : "text-slate-500 italic dark:text-slate-400"
                  }`}
                >
                  {competence || "Sélectionnez une discipline (Section A) pour afficher la compétence de base officielle."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Dropdown
                id="context_palier"
                name="palier"
                label="Palier"
                value={palier}
                onChange={(v) => { setPalier(v); resetFrom("palier"); }}
                options={paliersOpts}
                placeholder="Sélectionner le palier…"
                disabled={!discipline}
                disabledReason="Sélectionnez d'abord une discipline."
                loading={loadingStep === "oa"}
              />

              {/* OA — native select; locked until palier is chosen */}
              <div className={`transition-opacity duration-200 ${!palier ? "opacity-50" : "opacity-100"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                    Objectif d'Apprentissage (OA)
                  </p>
                  {loadingStep === "oa" && (
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin"/>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="context_oa"
                    name="oa"
                    value={oaIdx === "" ? "" : String(oaIdx)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOaIdx(v === "" ? "" : Number(v));
                      resetFrom("oaIdx");
                    }}
                    disabled={!palier || oaList.length === 0 || loadingStep === "oa"}
                    className={`w-full appearance-none rounded-xl px-4 py-3 pr-10 text-[13px] font-medium border-2 outline-none transition-all
                      ${!palier || oaList.length === 0 || loadingStep === "oa"
                        ? "bg-gray-50 border-gray-200 text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                        : oaIdx !== ""
                          ? "bg-accent border-primary text-foreground"
                          : "bg-card border-slate-200 text-slate-600 hover:border-slate-300 focus:border-primary cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                      }`}
                    style={oaIdx !== "" ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent)" } : {}}
                  >
                    <option value="">
                      {loadingStep === "oa" ? "Mise à jour…" : "Sélectionner l'objectif d'apprentissage…"}
                    </option>
                    {oaList.map((entry, i) => (
                      <option key={i} value={i}>{entry.oa}</option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loadingStep === "oa"
                      ? <Loader2 className="w-4 h-4 text-primary animate-spin"/>
                      : <ChevronDown className={`w-4 h-4 ${oaIdx !== "" ? "text-primary" : "text-gray-300"}`}/>} 
                  </span>
                </div>
                {oaIdx === "" && palier && oaList.length === 0 && (
                  <p className="mt-1 text-[10px] text-amber-600 font-medium">Aucun OA défini pour cette discipline.</p>
                )}
              </div>

              {/* OS — locked until an OA is chosen; changing it clears the panier */}
              <div className={`transition-opacity duration-200 ${oaIdx === "" ? "opacity-50" : "opacity-100"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>
                    Objectif Spécifique (OS)
                  </p>
                  {loadingStep === "os" && (
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin"/>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="context_os"
                    name="os"
                    value={selectedOS}
                    onChange={(e) => setSelectedOS(e.target.value)}
                    disabled={oaIdx === "" || osOpts.length === 0 || loadingStep === "os"}
                    className={`w-full appearance-none rounded-xl px-4 py-3 pr-10 text-[13px] font-medium border-2 outline-none transition-all
                      ${oaIdx === "" || osOpts.length === 0 || loadingStep === "os"
                        ? "bg-gray-50 border-gray-200 text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                        : selectedOS
                          ? "bg-accent border-primary text-foreground"
                          : "bg-card border-slate-200 text-slate-600 hover:border-slate-300 focus:border-primary cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                      }`}
                    style={selectedOS ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent)" } : {}}
                  >
                    <option value="">
                      {loadingStep === "os" ? "Mise à jour…" : "Sélectionner l'objectif spécifique…"}
                    </option>
                    {osOpts.map((os) => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loadingStep === "os"
                      ? <Loader2 className="w-4 h-4 text-primary animate-spin"/>
                      : <ChevronDown className={`w-4 h-4 ${selectedOS ? "text-primary" : "text-gray-300"}`}/>} 
                  </span>
                </div>
                {selectedOS && (
                  <p className="mt-1 text-[10px] font-semibold flex items-center gap-1" style={{ color: "var(--primary)" }}>
                    <Info className="w-3 h-3"/>
                    Le panier ci-dessous affiche uniquement les contenus liés à cet OS.
                  </p>
                )}
              </div>
            </div>
          </div>

          </div>{/* end lg:grid — close A+B 2-col grid */}

          {/* ══ SECTION C — full width below A+B grid ═════════ */}
          {/* Gate: requires selectedOS — not just discipline — to enforce strict cascade */}
          <div
            className={`bg-card rounded-2xl p-5 transition-all duration-300 ${selectedOS || loadingStep === "contenus" ? "opacity-100" : "opacity-40 pointer-events-none"}`}
            style={{ boxShadow: "0 2px 12px rgba(26,54,93,0.07), 0 1px 3px rgba(26,54,93,0.05)" }}
          >
            <SectionLabel step="C" label="Le Panier de Contenus" />

            {/* Subtitle + live counter row */}
            <div className="mb-3">
              <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5 dark:text-slate-300">
                Sélectionnez un ou plusieurs contenus du jour. Combinez plusieurs fragments selon le niveau de votre classe.
              </p>

              {/* Neutral counter strip */}
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5"
                  style={{
                    transition: "background-color 250ms ease, border-color 250ms ease",
                    backgroundColor: checked.size > 0 ? "color-mix(in srgb, var(--secondary) 12%, var(--background))" : "var(--muted)",
                    border: `1.5px solid ${checked.size > 0 ? "color-mix(in srgb, var(--secondary) 28%, transparent)" : "var(--border)"}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      transition: "background-color 250ms ease",
                      backgroundColor: checked.size > 0 ? "var(--secondary)" : "#b6c2d4",
                    }}
                  />
                  <span
                    className="text-[11px] font-semibold"
                    style={{
                      transition: "color 250ms ease",
                      color: checked.size > 0 ? "var(--secondary)" : "#64748b",
                    }}
                  >
                    Sélection&nbsp;:&nbsp;
                    <span style={{ fontWeight: 700, color: checked.size > 0 ? "var(--secondary)" : "#64748b" }}>
                      {checked.size} contenu{checked.size > 1 ? "s" : ""} choisi{checked.size > 1 ? "s" : ""}
                    </span>
                  </span>
                </div>
                {checked.size > 0 && (
                  <button
                    onClick={() => setChecked(new Set())}
                    className="shrink-0 text-[10px] font-bold text-slate-600 hover:text-red-500 transition-colors px-2 py-1 rounded-lg dark:text-slate-300"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Empty / loading state */}
            {loadingStep === "contenus" ? (
              /* Micro-loading spinner while OS filter is being applied */
              <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                <Loader2 className="w-6 h-6 text-primary animate-spin"/>
                <p className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>
                  Filtrage des contenus…
                </p>
              </div>
            ) : contenus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                  </svg>
                </div>
                <p className="text-[11px] text-center leading-relaxed text-muted-foreground">
                  {selectedOS
                    ? <>Aucun contenu trouvé pour cet OS.<br/>Vérifiez la base de données curriculaire.</>
                    : <>Sélectionnez un Objectif Spécifique (OS)<br/>pour afficher ses contenus.</>}
                </p>
              </div>
            ) : (
              /* ── Compact flex-wrap chip grid — 6 px gap, per-chip color cycle ── */
              <div className="flex flex-wrap gap-1.5">
                {contenus.map((contenu, i) => {
                  const c = CHIP_COLORS[i % CHIP_COLORS.length];
                  const on = checked.has(contenu);
                  return (
                    <button
                      key={contenu}
                      onClick={() => toggleCheck(contenu)}
                      className="inline-flex items-center gap-1 rounded-full leading-none select-none"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        paddingTop: "6px",
                        paddingBottom: "6px",
                        paddingLeft: "12px",
                        paddingRight: "12px",
                        transition: [
                          "background-color 160ms ease",
                          "color 160ms ease",
                          "border-color 160ms ease",
                          "box-shadow 160ms ease",
                          "transform 70ms ease",
                        ].join(", "),
                        backgroundColor: on ? c.bgOn  : c.bgOff,
                        color:           on ? c.textOn : c.textOff,
                        border:          `1.5px solid ${on ? c.borderOn : c.borderOff}`,
                        boxShadow:       on ? `0 2px 8px ${c.shadowOn}` : "none",
                      }}
                      onPointerDown={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)";
                      }}
                      onPointerUp={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                      }}
                      onPointerLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                      }}
                    >
                      {/* Checkmark slides in/out via width animation */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          width: on ? "12px" : "0px",
                          overflow: "hidden",
                          transition: "width 150ms ease",
                          flexShrink: 0,
                        }}
                      >
                        <svg viewBox="0 0 10 8" style={{ width: 10, height: 10, flexShrink: 0 }} fill="none">
                          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span style={{ opacity: 0.55, marginRight: "3px", fontWeight: 700, letterSpacing: "0.02em" }}>
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      {contenu}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Fixed bottom CTA ──────────────────────────────── */}
        <div
          className="fixed bottom-[72px] lg:bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md lg:max-w-4xl px-4 lg:px-6 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:pb-6 pt-8 pointer-events-none"
          style={{ background: "transparent" }}
        >
          {/* ── Merge toggle + tooltip — only when ≥ 2 contenus selected ── */}
          {checked.size > 1 && (
            <div className="relative mb-2.5 pointer-events-auto">

              {/* ── Floating tooltip — renders above the checkbox ── */}
              {tooltipOpen && (
                <div
                  className="absolute left-0 right-0 rounded-2xl p-4 pointer-events-auto"
                  style={{
                    bottom: "calc(100% + 10px)",
                    backgroundColor: "var(--card)",
                    border: "1.5px solid var(--border)",
                    boxShadow: "0 -4px 24px rgba(26,54,93,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                    zIndex: 50,
                  }}
                >
                  {/* Tooltip caret */}
                  <div
                    className="absolute left-6"
                    style={{
                      bottom: "-7px",
                      width: 0, height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderTop: "7px solid color-mix(in srgb, var(--border) 92%, transparent)",
                    }}
                  />
                  <div
                    className="absolute left-6"
                    style={{
                      bottom: "-5.5px",
                      width: 0, height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: "6px solid var(--card)",
                    }}
                  />

                  <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>
                    Comment ça marche ?
                  </p>

                  {/* COCHÉ bullet */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--accent)", border: "1.5px solid var(--primary)" }}
                    >
                      <svg viewBox="0 0 10 8" style={{ width:9, height:9 }} fill="none">
                        <path d="M1 4l3 3 5-6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold leading-none mb-1" style={{ color: "var(--foreground)" }}>COCHÉ</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        Regroupe toutes vos séquences sélectionnées dans un seul grand déroulé continu
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}> (recommandé pour les séances consolidées)</span>.
                      </p>
                    </div>
                  </div>

                  {/* DÉCOCHÉ bullet */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--muted)", border: "1.5px solid var(--border)" }}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "var(--muted-foreground)" }}/>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold leading-none mb-1" style={{ color: "var(--foreground)" }}>DÉCOCHÉ</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        Crée des onglets distincts <span className="font-semibold" style={{ color: "var(--foreground)" }}>(Multi-Tabs)</span> sur
                        l'écran d'édition, vous permettant de préparer une fiche indépendante pour chaque contenu.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Checkbox row ── */}
              <div
                className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer active:scale-[0.99]"
                style={{
                  backgroundColor: merged ? "var(--accent)" : "var(--background)",
                  border: `1.5px solid ${merged ? "var(--primary)" : "var(--border)"}`,
                }}
                onClick={() => { setMerged(o => !o); setTooltipOpen(false); }}
              >
                {/* Custom checkbox square */}
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150"
                  style={{
                    backgroundColor: merged ? "var(--primary)" : "var(--background)",
                    borderColor:     merged ? "var(--primary)" : "var(--border)",
                  }}
                >
                  {merged && (
                    <svg viewBox="0 0 10 8" style={{ width:12, height:12, flexShrink:0 }} fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Label + info icon */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5 flex-wrap">
                    <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
                      Fusionner les contenus sélectionnés dans une seule fiche de préparation
                    </p>
                    {/* Info / tooltip trigger — stops propagation so it doesn't toggle checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setTooltipOpen(o => !o); }}
                      className="shrink-0 transition-colors active:scale-90 mt-0.5"
                      aria-label="En savoir plus"
                      title="En savoir plus"
                    >
                      <HelpCircle
                        className="w-4 h-4"
                        style={{ color: tooltipOpen ? "var(--primary)" : "var(--muted-foreground)" }}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] mt-0.5 leading-tight"
                    style={{ color: merged ? "var(--primary)" : "var(--muted-foreground)" }}>
                    {merged
                      ? "Un seul tableau continu · toutes les séquences à la suite"
                      : "Par défaut : fiches indépendantes, un onglet par contenu"}
                  </p>
                </div>

                {/* Mode badge */}
                <span
                  className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full mt-0.5"
                  style={{
                    backgroundColor: merged ? "var(--primary)" : "var(--muted)",
                    color:           merged ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {merged ? "Fusionné" : "Onglets"}
                </span>
              </div>
            </div>
          )}

          <div ref={missingHintsRef} className="relative pointer-events-auto flex justify-center lg:justify-end">
            {showMissingHints && !canProceed && (
              <div
                className="absolute bottom-16 lg:bottom-14 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-0 w-[min(340px,calc(100vw-2rem))] rounded-2xl p-3"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 12px 28px color-mix(in srgb, var(--foreground) 12%, transparent)",
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--foreground)" }}>
                  Champs à renseigner
                </p>
                <p className="text-[11px] mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Complétez ces éléments pour activer le bouton.
                </p>
                <ul className="space-y-1.5">
                  {missingFields.slice(0, 6).map((field) => (
                    <li key={field} className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--foreground)" }}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#f59e0b" }} />
                      <span>{field}</span>
                    </li>
                  ))}
                  {missingFields.length > 6 && (
                    <li className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      +{missingFields.length - 6} autre(s) champ(s)
                    </li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={handleNext}
              className="h-12 sm:h-[50px] w-full max-w-[320px] lg:w-auto lg:max-w-none min-w-[160px] px-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95"
              aria-label={canProceed ? "Continuer vers le canevas" : "Afficher les champs manquants"}
              title={canProceed ? "Continuer vers le canevas" : "Voir les champs manquants"}
              style={
                canProceed
                  ? {
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                      border: "1px solid color-mix(in srgb, var(--primary) 70%, var(--border))",
                      boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 38%, transparent)",
                    }
                  : {
                      backgroundColor: "color-mix(in srgb, var(--card) 78%, var(--muted) 22%)",
                      color: "var(--muted-foreground)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 8px 22px color-mix(in srgb, var(--foreground) 10%, transparent)",
                    }
              }
            >
              {canProceed ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} />
              )}
              <span className="text-[13px] font-semibold whitespace-nowrap">
                {canProceed ? "Passer au canevas" : `Passer au canevas • ${missingFields.length}`}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
