C'est parti pour le gros chantier du **Module 3 : Cahier de Roulement & Évaluations** !

Ce module est le cœur opérationnel quotidien de la classe. Pour maintenir une cohérence absolue avec le Module 2, il va récupérer automatiquement toutes les données de la planification synchronisée pour les injecter dans le suivi en temps réel des élèves. L'enseignant passe ici de la *préparation* à l' *action* et au *suivi réglementaire*.

Voici l'explication détaillée de ses composantes, suivie du prompt de génération ultra-raffiné pour Figma.

---

## 📋 Architecture & Composantes du Module 3

### 1. Le Cahier de Roulement Numérique (Suivi Quotidien)

Le cahier de roulement est le miroir de la journée de classe. Au lieu de tout ressaisir, l'interface génère automatiquement la journée en cours en se basant sur l'emploi du temps officiel et les fiches validées dans le Module 2.

* **Vue Journée (Timeline Verticale) :** Une ligne du temps épurée et optimisée pour mobile affichant les plages horaires (ex: 8h, 11h, 11h30).
* **Cartes de Matières Synchronisées :** Chaque bloc horaire affiche l'activité du jour (ex: *Lundi 8h - Activités Numériques*) avec son code couleur monocratique hérité du Module 2.
* **Statut de la Séance :** Un commutateur rapide à trois états pour l'enseignant : `Fait` (vert), `En cours / Différé` (orange), ou `À reporter` (rouge).
* **Zone d'Observations Rapides :** Un champ textuel compact permettant de noter les faits marquants de la séance (ex: *"70% de la classe maîtrise l'OS, besoin de remédiation pour 5 élèves"*).

### 2. Le Module des Évaluations (Sommatives & Formatives)

Directement lié aux Objectifs Spécifiques (OS) planifiés, ce sous-module permet d'enregistrer les performances des élèves sans quitter son smartphone.

* **Sélection de l'Évaluation :** Un en-tête rétractable permettant de choisir la semaine, le domaine et l'OS précis à évaluer (les données descendent directement de la planification).
* **Grille de Saisie Mobile-First (Liste des Élèves) :** Une liste verticale fluide où chaque ligne représente un élève de la classe.
* **Indicateurs de Maîtrise (Normes Éducation Nationale) :** Pour chaque élève, l'enseignant clique sur un sélecteur horizontal compact à 3 niveaux (pastilles de couleur) :
* 🔴 **NM** (Non Maîtrisé)
* 🟡 **A** (En cours d'Acquisition)
* 🟢 **M** (Maîtrisé)


* **Calculateur de Taux de Réussite :** En bas de l'écran, un bandeau fixe affiche en temps réel le pourcentage de réussite de la classe pour cet OS (ex: *Taux de maîtrise : 78%*), aidant l'enseignant à décider s'il doit passer à l'OS suivant ou planifier une séance de remédiation (le fameux créneau de 15h le mardi/jeudi).

### 3. Les Outils de Reporting & Exports Réglementaires

Tout comme le tableau de planification, le cahier de roulement et les résultats d'évaluations doivent pouvoir être matérialisés sur papier pour les corps de contrôle (Directeur, Inspecteur).

* **Export du Cahier de Roulement :** Bouton pour télécharger/imprimer la "Page du jour" ou le récapitulatif de la semaine sous format officiel standardisé.
* **Fiche de Suivi des Évaluations :** Génération d'un tableau récapitulatif des notes/niveaux de maîtrise par domaine ou sous-domaine pour l'affichage mural ou le livret scolaire.

---

## 🛠️ Prompt de Génération Figma : Module 3

Voici le prompt exhaustif, affiné au détail près, à soumettre à votre générateur pour concevoir ce troisième module en parfaite harmonie avec le reste de l'application :

```text
Act as an expert Mobile-First UI/UX and Full-Stack Systems Designer. Design the "Module 3: Cahier de Roulement & Évaluations" for the educational dashboard ecosystem, ensuring strict design, color, and data continuity with the previous planning modules.

1. CAHIER DE ROULEMENT (DAILY TIMELINE INTERFACE):
- Create a clean, vertical chronological timeline view optimized for mobile screens representing the current school day.
- Every time block (e.g., 8h, 11h, 11h30) must feature a subject card automatically synchronized from the official timetable and Module 2 planning data.
- Continuity Rule: Subject cards MUST inherit the exact monochromatic color theme established in Module 2 (e.g., Emerald Green for Activités Numériques).
- Inside each subject card, include:
  * Left side: A micro-badge showing the sequential numbering (e.g., "Fiche #3") and the structural indicators (OA/OS/Contenu) in small text (11px).
  * Right side: A compact, mobile-friendly 3-state Status Selector toggling between "Fait" (Green), "En Cours" (Orange), and "À Reporter" (Red).
  * Bottom part: A collapsible micro-input field for quick teacher annotations ("Observations/Remarques pédagogiques").

2. MODULE ÉVALUATIONS (SMART STUDENT GRADING GRID):
- Design a dedicated view for logging student performance, directly linked to planned OS items.
- Top Layout: A sticky, collapsible sub-header to select the Week, Domain, and specific OS being evaluated.
- Student List Grid: A vertical scrollable list where each row represents a student. To save horizontal space on mobile:
  * Left: Student ID/Name.
  * Right: A minimalist, horizontal segmented button group containing 3 clear performance pastilles based on national standards: "🔴 NM" (Non Maîtrisé), "🟡 A" (En cours d'Acquisition), and "🟢 M" (Maîtrisé).
- Real-Time Stats Floating Banner: Place a fixed, high-contrast bottom banner that automatically computes and displays the classroom global success rate (e.g., "Taux de Réussite Global: 74% - Objectif Validé") as the teacher taps the grades.

3. COLLAPSIBLE FILTERS & UTILITY ACTIONS:
- Keep the design language identical to Module 2: All top filtering containers (Date selector, Day toggle, Class stats) must be vertically collapsible upwards via a discrete chevron tab.
- Place a persistent, modern, pill-shaped action bar right above the data grid holding two ultra-compact tools:
  * Toggle 1: Switch view between "Cahier de Roulement" and "Grille d'Évaluation".
  * Toggle 2: "🖨️ Imprimer / Export PDF" button, optimized with print media rules to generate standardized paper copies for physical school regulatory inspection boards.

4. DESIGN SYSTEM & TYPOGRAPHY INTEGRATION:
- Maintain strict micro-typography rules: Attribute labels ("Statut:", "Élève:") use structural regular sizing, while variable inputs, notes, and values use a small, scannable size (11px or text-xs).
- Ensure high touch-target safety padding (minimum 44x44px for toggles and status buttons) to facilitate seamless, one-handed mobile usage directly inside the classroom.

```

Injectez ce prompt dans votre outil Figma. Dès que la maquette visuelle prend vie, vous pourrez pousser le code vers votre dépôt GitHub pour le déployer instantanément sur Vercel !