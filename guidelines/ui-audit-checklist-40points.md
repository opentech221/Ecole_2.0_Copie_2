# Checklist UI Audit - 40 Points

## Objectif
Utiliser cette checklist ecran par ecran pour mesurer la conformite:
1. Mobile First
2. Responsive Design
3. Accessibilite

## Regle de notation
1. Chaque point vaut 1.
2. Oui = 1, Non = 0.
3. Score Mobile First = somme des points M.
4. Score Responsive = somme des points R.
5. Score Accessibilite = somme des points A.
6. Score Global = total sur 40.

Repartition:
1. M (Mobile First) = 14 points
2. R (Responsive) = 13 points
3. A (Accessibilite) = 13 points

---

## A. Mobile First (14 points)
1. M01. L'ecran est parfaitement exploitable entre 360 px et 390 px de large.
2. M02. Le contenu principal est visible sans zoom navigateur.
3. M03. Une seule action primaire ressort clairement dans la zone visible initiale.
4. M04. Les actions critiques sont atteignables au pouce (zone basse ou sticky action).
5. M05. Les boutons tactiles importants font au moins 44x44 px.
6. M06. Les espacements verticaux restent lisibles meme en faible hauteur d'ecran.
7. M07. Les formulaires affichent un clavier adapte (email, telephone, numerique).
8. M08. Le focus passe proprement d'un champ a l'autre sur mobile.
9. M09. Les messages d'erreur de formulaire sont visibles sans scroll excessif.
10. M10. Les tableaux complexes ont une alternative mobile (cartes, accordions, vue simplifiee).
11. M11. Les filtres sont utilisables en chips ou en bottom sheet sur mobile.
12. M12. Les modales ne debordent pas en hauteur sur petits ecrans.
13. M13. Le texte principal reste lisible sans micro-typo (pas de texte utile minuscule).
14. M14. Les elements interactifs n'entrent pas en conflit avec la barre systeme mobile.

---

## B. Responsive Design (13 points)
1. R01. Le layout s'adapte proprement sur 360, 768, 1024 et 1440 px.
2. R02. Aucune coupure de texte critique sur les points de rupture.
3. R03. Les colonnes se reorganisent sans superposition visuelle.
4. R04. Les images et medias gardent leur ratio sans deformation.
5. R05. Les zones de contenu ne depassent pas horizontalement (pas de scroll parasite).
6. R06. Les composants de navigation changent de pattern selon la taille d'ecran de facon coherente.
7. R07. Les cartes utilisent une grille fluide et stable.
8. R08. Les zones sticky (header/footer/actions) ne masquent pas le contenu.
9. R09. Les formulaires multi-colonnes se replient en une colonne sur mobile.
10. R10. Les marges internes et externes restent harmonieuses a toutes tailles.
11. R11. Les etats vides, chargement et erreur sont correctement responsives.
12. R12. Les tableaux ou listes longues restent navigables sur tablette.
13. R13. Le changement d'orientation mobile (portrait/paysage) ne casse pas l'UI.

---

## C. Accessibilite (13 points)
1. A01. Le contraste texte/fond respecte un niveau lisible (AA minimum).
2. A02. Les couleurs ne sont pas le seul moyen de transmettre une information.
3. A03. Les boutons et liens ont un libelle explicite (pas seulement une icone muette).
4. A04. L'ordre de tabulation clavier est logique.
5. A05. Le focus clavier est clairement visible sur tous les composants interactifs.
6. A06. Les champs de formulaire ont des labels associes et comprehensibles.
7. A07. Les erreurs sont annoncees clairement avec message actionnable.
8. A08. Les modales piegent correctement le focus et permettent fermeture clavier.
9. A09. Les composants dynamiques importants (toasts, chargement, erreurs) sont perceptibles.
10. A10. Les titres structurent correctement la page (hierarchie coherente).
11. A11. Les zones cliquables proches sont suffisamment espacees pour eviter les erreurs tactiles.
12. A12. Les animations ne genent pas l'usage et respectent la preference de reduction de mouvement.
13. A13. Le contenu reste comprehensible a 200 % de zoom.

---

## Grille de score
1. Mobile First: /14
2. Responsive: /13
3. Accessibilite: /13
4. Global: /40

Niveaux de conformite:
1. 36-40: Excellent, pret production.
2. 30-35: Bon, quelques corrections ciblees.
3. 22-29: Moyen, corrections importantes a planifier.
4. 0-21: Critique, reprise UX/UI prioritaire.

---

## Template rapide a dupliquer par ecran
1. Nom de l'ecran:
2. Auditeur:
3. Date:
4. Mobile First: X/14
5. Responsive: X/13
6. Accessibilite: X/13
7. Global: X/40
8. Top 3 problemes bloquants:
9. Correctifs immediats (48 h):
10. Correctifs sprint suivant:
