Act as a premium UI/UX Design Engineer specialized in modern administrative and academic management systems. Design a sleek, modern, multi-view Dashboard component and layout tailored for the primary education ecosystem (inspired by the IA/IEF Kolda curriculum layout). The interface must seamlessly unify administrative tracking with high-end print-ready document output.

1. USER JOURNEY & NAVIGATION ACCESSIBILITY (Entry Points & Layout):
- Home Page Entry (Page d'Accueil): Include a prominent, clean dashboard card or module widget titled "Module 3 : Gestion & Suivi des Performances". Clicking this card instantly opens the Module 3 workspace.
- Global Sidebar Navigation: Ensure a persistent, minimalist left sidebar contains a direct link to "Module 3: Évaluations & Registres" to allow access from anywhere in the application.
- Workspace Tab Switcher (Barre d'onglets): Inside Module 3, implement a highly visible, horizontal tab navigation bar at the top of the content area. The teacher can fluidly toggle between three sub-views without page reloads:
  * Tab 1: [Liste Nominative] (Active view for roster management)
  * Tab 2: [Cahier de Registre] (Active view for daily/weekly attendance)
  * Tab 3: [Bulletins de Notes] (Active view for grading and report card generation)

2. COMPONENT 1: LISTE NOMINATIVE DES ÉLÈVES (Mobile Responsive View)
- Structure: A clean, data-dense but highly legible table containing the core roster, active when the "Liste Nominative" tab is selected.
- Data Rows: Each student record displays an avatar icon, Unique ID/Matricule, Full Name (e.g., "KADIATA BA"), Gender (F/M), Date & Place of Birth, and Guardian Contact (Name + Phone).
- Top Metrics Bar: Micro-dashboard indicators displaying "Total Élèves", "Nombre de Filles", "Nombre de Garçons", and an automatically calculated "Taux de Parité (%)".
- Mobile Responsiveness & Horizontal Scrolling: On mobile devices, the layout container must explicitly allow fluent horizontal swiping/scrolling (`overflow-x: auto`) specifically for the data table. This guarantees that hidden columns (Date & Place of Birth, Guardian, Contact, and Action buttons) remain easily accessible via swipe without breaking the screen's vertical layout.
- Quick Actions: Minimalist interactive buttons for "Ajouter un élève", "Importer CSV/Excel", and "Exporter la liste (PDF)".

3. COMPONENT 2: CAHIER DE REGISTRE NUMÉRIQUE (Attendance Matrix & Month Picker)
- Structure: A rigid, highly structured grid bound to the "Liste Nominative". 
- Full Identity Compliance: Student names must be written out completely in full, exactly matching the official layout of the "Liste Nominative" (No truncating or shortening).
- Month Selection UI: Include a clean interactive dropdown menu or horizontal selector ("Sélecteur de Mois") at the top to fluidly switch between different months of the school year.
- High-Contrast Matrix Borders: All rows and day columns must be heavily and clearly materialized with high-contrast structural grid lines. Every calendar day column divider must be perfectly visible to allow the user's eye to easily track and distinguish different days of the selected month without confusion.
- Status Markers: Provide distinct, lightweight visual indicators for tracking: Present (Default empty/subtle check), Absent Non Justifié (High-contrast red), Absent Justifié (Amber), En Retard (Blue). Total term absences must carry dynamically into the individual student profile and final report card.

4. COMPONENT 3: BULLETIN DE NOTES TRIMESTRIEL (Dual-Print & Typography Optimization)
- Entry Point: Active when the "Bulletins de Notes" tab is selected. Features a side-list or dropdown to quickly pick a student from the registry to load their specific report card.
- Minimalist Institutional Header: Left side displays strict hierarchy ("IA: IA Kolda", "IEF: IEF Kolda", "École: Ilyaou Mamadou SEYDI"). Right side displays "RÉPUBLIQUE DU SÉNÉGAL" with official motto alignment.
- Student Focus Card: Clean container with subtle borders displaying the selected student's active metadata from the registry, alongside a colored pill badge for the term (e.g., "3ème Trimestre").
- High-Visibility Assessment Grid: Scale up the typography scale significantly. Learning domains, disciplines/activities, and final numerical marks must use large, crisp, bold, and high-visibility fonts. This scale adjustment explicitly counters the scaling-down effect during dual-printing, ensuring perfect legibility for parents and inspectors.
  * DOMAINE: FRANÇAIS / LANGUE & COMMUNICATION (Sub-rows: Compréhension, Vocabulaire, Grammaire, Orthographe, Production d'écrit).
  * DOMAINE: MATHÉMATIQUES (Sub-rows: Activités Numériques, Activités de Mesure, Activités Géométriques, Résolution de Problèmes).
  * DOMAINE: DÉCOUVERTE DU MONDE (Sub-rows: Histoire, Géographie, IST).
  * DOMAINE: ÉDUCATION AU DÉVELOPPEMENT DURABLE (Sub-rows: Vivre dans son milieu, Vivre ensemble).
  * DOMAINE: ARTS & SPORT (Sub-rows: Éducation Musicale, Arts Plastiques, EPS).

5. COMPONENT 4: STATISTICAL MATRIX & T3 DECISION DASHBOARD
- Evaluation Grid: A neat 3-row metric card containing global performance variables:
  * Row 1 (History): Moyenne T1 | Moyenne T2 | Moyenne T3
  * Row 2 (Class Context): Moyenne Générale | Moyenne Classe | Plus Forte Moyenne
  * Row 3 (Status & Attendance): Rang Trimestriel | Total des Points | Absences du Trimestre (Injected automatically from the Cahier de Registre)
- Trimestre 3 Decision Panel: Include an automated "CONSEIL DE CLASSE" conditional status block displaying one explicit evaluation badge:
  * [GREEN BADGE]: "Admis(e) en classe supérieure (CM1)" if Moyenne Générale >= 5.00/10.
  * [AMBER BADGE]: "Autorisé(e) à passer le test de passage" if Moyenne Générale between 4.50 and 4.99.
  * [RED BADGE]: "Redoublement proposé" if Moyenne Générale < 4.50.
- Footnote: 3 evenly spaced columns for physical validation: [L'Enseignant(e)] | [Le Directeur / La Directrice] | [Les Parents].

6. UI DESIGN SYSTEM & DUAL-PRINT CONSTRAINTS (A4 2-Per-Page Rule):
- Palette & Typography: Crisp monochrome lines, micro-typography hierarchy, and high-contrast alert states for attendance/decisions. 
- Print-to-Scale Layout: When print mode is triggered, hide the Top Navigation Bar (Tabs), sidebar navigation, digital buttons, and empty placeholders.
- Dimensions Constraint: Structure each "Bulletin de Notes" block component with a strict height-to-width aspect ratio designed specifically so that exactly **two complete bulletins fit perfectly onto a single standard vertical A4 sheet** (Paysage layout with 2 vertical bulletins, or Portrait cut-in-half) without ever overflowing or clipping margins, maintaining sharp text readability at a distance.