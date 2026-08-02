import { avg, computeWeightedAvg, totalAbsencesNJ, type GradeSet } from "./grades";

type Trimestre = 1 | 2 | 3;

interface DomainConfig {
  label: string;
  color: string;
  disciplines: string[];
}

export interface BulletinStudent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  tuteurNom: string;
}

export const BATCH_PRINT_CSS = `
  /* ── Global setup (applies inside the isolated print document) ── */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin:0; font-family:Arial,Helvetica,sans-serif; background:#fff;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:A4 portrait; margin:0; }
  .no-print { display:none !important; }

  /* ── bi-* print typography (global so they apply to all inner content) ── */
  .bi-title         { font-size:16pt !important; font-weight:900 !important; letter-spacing:0.09em !important; }
  .bi-student-label { font-size:8pt  !important; font-weight:700 !important; text-transform:uppercase !important; }
  .bi-student-val   { font-size:10pt !important; font-weight:700 !important; }
  .bi-th            { padding:3pt 7pt !important; font-size:9pt   !important; }
  .bi-domain-td     { padding:2pt 8pt !important; font-size:9.5pt !important; font-weight:900 !important; }
  .bi-disc-name     { padding:2pt 7pt 2pt 12pt !important; font-size:9pt !important; font-weight:600 !important; }
  .bi-score         { padding:2pt 7pt !important; font-size:11pt !important; font-weight:800 !important; }
  .bi-stat-cell     { padding:2pt 5pt !important; }
  .bi-stat-label    { font-size:6.5pt !important; margin:0 !important; }
  .bi-stat-value    { font-size:10pt  !important; font-weight:800 !important; margin:0 !important; }
  .bi-signature-block { min-height:80px !important; margin-top:auto !important;
                         border-top:2pt solid #1a365d !important; padding-top:8px !important; }
  .bi-sig-name    { font-size:9pt   !important; font-weight:700 !important; margin:0 0 20px !important; }
  .bi-sig-line    { border-bottom:1pt solid #94a3b8 !important; }
  .bi-sig-caption { font-size:7.5pt !important; color:#6b7280 !important; }

  /* ═══════════════════════════════════════════════════════════════════════════
     A4 PAGE ENFORCEMENT — strictement dans @media print
     ═══════════════════════════════════════════════════════════════════════════ */
  @media print {

    /* 1. Nettoyage total du flux d'impression.
          contain:none — désactive l'optimisation de "containment" que les
          navigateurs mobiles appliquent pour isoler les blocs, ce qui fusionne
          tous les bulletins dans le même espace de rendu → superposition.    */
    body, #root, #ecole-print-portal {
      margin:   0 !important;
      padding:  0 !important;
      height:   auto !important;
      overflow: visible !important;
      contain:  none !important;
    }
    #ecole-print-portal {
      display: block !important;
      width:   100% !important;
      contain: none !important;
    }

    /* 2. Chaque bulletin = une page A4 complète en flex-column.
          justify-content:space-between pousse .footer-signatures tout en bas
          et laisse .bulletin-content-body occuper le reste (flex-grow:1).
          height:290mm = A4 avec marges mobiles intégrées dans le padding.
          Pas de page-break-before : provoquerait une page blanche initiale. */
    .bulletin-page {
      display:            flex !important;
      flex-direction:     column !important;
      justify-content:    space-between !important;
      width:              100% !important;
      height:             290mm !important;
      padding:            10mm !important;
      box-sizing:         border-box !important;
      page-break-after:   always !important;
      break-after:        page !important;
      page-break-before:  auto !important;
      break-before:       auto !important;
      page-break-inside:  avoid !important;
      break-inside:       avoid !important;
      margin:             0 !important;
      background:         #fff !important;
      contain:            none !important;
    }
    .bulletin-page:last-child {
      page-break-after: auto !important;
      break-after:      auto !important;
    }

    /* 3. Corps du bulletin : occupe tout l'espace vertical disponible
          entre le haut de la page et le bloc signatures.                   */
    .bulletin-content-body {
      flex-grow:      1 !important;
      display:        flex !important;
      flex-direction: column !important;
    }

    /* 4. Bloc signatures : ancré en bas, jamais coupé par une fin de page. */
    .footer-signatures {
      width:              100% !important;
      break-inside:       avoid !important;
      page-break-inside:  avoid !important;
      margin-top:         auto !important;
      padding-top:        20px !important;
      flex-shrink:        0 !important;
    }

    /* 5. Anti-superposition mobile : tout positionnement absolu/fixe renvoyé
          au flux normal (spécificité 0,0,0 → surchargé par les règles ci-dessus). */
    .bulletin-page * {
      position: static !important;
    }

    /* 6. Réglage fin : line-height légèrement étendu sur les cellules du
          tableau pour que les notes remplissent naturellement l'espace vertical
          sans être ni trop serrées ni trop aérées.                           */
    .bulletin-page td, .bulletin-page th {
      line-height: 1.55 !important;
    }
  }
`;

interface BuildOneBulletinHtmlParams {
  student: BulletinStudent;
  grades: Record<string, GradeSet>;
  trimestre: Trimestre;
  classLabel: string;
  schema: Record<string, number>;
  rank: number;
  absNJ: number;
  domains: DomainConfig[];
}

// Generates the HTML for a single student's bulletin as a pure template string.
// Zero React / Zero DOM — no components rendered, no nodes created or cloned.
// This is the only approach that is guaranteed crash-free on mobile browsers.
export function buildOneBulletinHtml({
  student,
  grades,
  trimestre,
  classLabel,
  schema,
  rank,
  absNJ,
  domains,
}: BuildOneBulletinHtmlParams): string {
  const trimLabel = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";
  const moy = computeWeightedAvg(grades, trimestre, schema);
  const scoreCols: Array<1 | 2 | 3> = trimestre === 3 ? [1, 2, 3] : [trimestre as 1 | 2];
  const scoreOf = (g: GradeSet | undefined, t: 1 | 2 | 3) =>
    t === 1 ? g?.t1 : t === 2 ? g?.t2 : g?.t3;

  const tableHead = scoreCols
    .map(
      t =>
        `<th style="padding:3px 8px;text-align:center;color:#fff;font-weight:800;font-size:9pt;width:${trimestre === 3 ? "60px" : "100px"}">T${t} /10</th>`,
    )
    .join("");

  const tableBody = domains
    .map(dom => {
      const domRow = `<tr><td colspan="${1 + scoreCols.length}" style="padding:2px 8px;background:${dom.color}18;font-weight:900;font-size:9pt;color:${dom.color};text-transform:uppercase;letter-spacing:.05em;border-left:4px solid ${dom.color};border-top:1px solid #e2e8f0">${dom.label}</td></tr>`;
      const discRows = dom.disciplines
        .map((disc, ri) => {
          const g = grades[disc];
          const max = schema[disc] ?? 10;
          const cells = scoreCols
            .map(t => {
              const sc = scoreOf(g, t);
              const pass = (sc ?? 0) >= max / 2;
              return `<td style="padding:2px 7px;text-align:center;font-weight:800;font-size:11pt;color:${pass ? "#059669" : "#dc2626"};border-bottom:1px solid #e5e7eb;border-left:1px solid #f1f5f9">${sc !== undefined ? sc.toFixed(2) : "—"}</td>`;
            })
            .join("");
          return `<tr style="background:${ri % 2 === 0 ? "#fff" : "#f9fafb"}"><td style="padding:2px 7px 2px 13px;font-size:9pt;color:#1e293b;font-weight:600;border-bottom:1px solid #e5e7eb">${disc}</td>${cells}</tr>`;
        })
        .join("");
      return domRow + discRows;
    })
    .join("");

  const a1 = avg(grades, 1);
  const a2 = avg(grades, 2);
  const statCells = (
    trimestre === 1
      ? [
          ["Moy. T1", `${moy.toFixed(2)}/10`, moy >= 5 ? "#059669" : "#dc2626"],
          ["Rang", `${rank}e/25`, "#475569"],
          ["Abs. NJ", `${absNJ} j`, absNJ > 3 ? "#dc2626" : "#059669"],
        ]
      : trimestre === 2
        ? [
            ["Moy. T1", `${a1.toFixed(2)}/10`, "#94a3b8"],
            ["Moy. T2", `${moy.toFixed(2)}/10`, moy >= 5 ? "#059669" : "#dc2626"],
            ["Rang", `${rank}e/25`, "#475569"],
            ["Abs. NJ", `${absNJ} j`, absNJ > 3 ? "#dc2626" : "#059669"],
          ]
        : [
            ["Moy. T1", `${a1.toFixed(2)}/10`, "#94a3b8"],
            ["Moy. T2", `${a2.toFixed(2)}/10`, "#94a3b8"],
            ["Moy. T3", `${moy.toFixed(2)}/10`, moy >= 5 ? "#059669" : "#dc2626"],
            ["Moy. Gén.", `${((a1 + a2 + moy) / 3).toFixed(2)}/10`, "#1a365d"],
            ["Rang", `${rank}e/25`, "#475569"],
            ["Abs. NJ", `${absNJ} j`, absNJ > 3 ? "#dc2626" : "#059669"],
          ]
  )
    .map(
      ([l, v, c]) =>
        `<div style="padding:3px 6px;border-radius:4px;background:#f8fafc;border:1px solid #e2e8f0"><p style="font-size:6.5pt;color:#64748b;font-weight:700;text-transform:uppercase;margin:0">${l}</p><p style="font-size:10pt;font-weight:800;color:${c};margin:0">${v}</p></div>`,
    )
    .join("");
  const statCols = trimestre === 2 ? "repeat(4,1fr)" : "repeat(3,1fr)";

  const dec =
    moy >= 5
      ? { label: "Admis(e) en classe supérieure (CM1)", color: "#059669", bg: "#dcfce7" }
      : moy >= 4.5
        ? { label: "Autorisé(e) à passer le test de passage", color: "#d97706", bg: "#fef3c7" }
        : { label: "Redoublement proposé", color: "#dc2626", bg: "#fee2e2" };
  const decHtml =
    trimestre === 3
      ? `<div style="padding:4px 10px;border-radius:5px;margin-bottom:4px;background:${dec.bg};border:2px solid ${dec.color}"><p style="font-size:7pt;font-weight:800;color:${dec.color};text-transform:uppercase;margin:0">DÉCISION DU CONSEIL DE CLASSE</p><p style="font-size:11pt;font-weight:800;color:${dec.color};margin:0">${dec.label}</p></div>`
      : "";

  const idRows = [
    ["Élève", `${student.nom} ${student.prenom}`],
    ["Matricule", student.matricule],
    ["Classe", classLabel],
    ["Trimestre", `${trimLabel} Trimestre`],
    ["IEF", "Inspection de Kolda"],
    ["École", "Ilyaou Mamadou SEYDI"],
    ["Date de naiss.", student.dateNaissance],
    ["Lieu de naiss.", student.lieuNaissance],
    ["Tuteur / Parent", student.tuteurNom],
    ["Année scolaire", "2025–2026"],
  ]
    .map(
      ([l, v]) =>
        `<div style="line-height:1.35;word-break:break-word"><span style="font-size:8pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">${l}: </span><span style="font-size:10pt;font-weight:700;color:#1a365d">${v}</span></div>`,
    )
    .join("");

  return `<div class="bulletin-page">

  <div class="bulletin-content-body">
    <div style="text-align:center;border-bottom:2.5px solid #1a365d;padding-bottom:5px;margin-bottom:5px">
      <p style="font-size:16pt;font-weight:900;color:#1a365d;text-transform:uppercase;letter-spacing:.10em;margin:0 0 2px">Bulletin de Notes Trimestrielles</p>
      <p style="font-size:9pt;color:#475569;margin:0">${trimLabel} Trimestre · Année Scolaire 2025–2026</p>
    </div>
    <div style="background:#eff6ff;border-radius:5px;border:1px solid #bfdbfe;padding:5px 10px;margin-bottom:6px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px">${idRows}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:5px">
      <thead><tr style="background:#1a365d"><th style="padding:4px 8px;text-align:left;color:#fff;font-weight:800;font-size:9pt;letter-spacing:.04em">DISCIPLINE / ACTIVITÉ</th>${tableHead}</tr></thead>
      <tbody>${tableBody}</tbody>
    </table>
    <div style="display:grid;grid-template-columns:${statCols};gap:4px;margin-bottom:5px">${statCells}</div>
    ${decHtml}
  </div>

  <div class="footer-signatures">
    <div style="border-top:2px solid #1a365d;padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
      ${["Le Maître|Nom &amp; Signature — Cachet", "Le Directeur|Cachet officiel — Signature"].map(s => {
        const [l, sub] = s.split("|");
        return `<div style="text-align:center;display:flex;flex-direction:column;justify-content:flex-end;min-height:60px"><p style="font-size:9pt;font-weight:700;color:#1a365d;margin:0 0 16px">${l}</p><div><div style="border-bottom:1px solid #94a3b8"></div><p style="font-size:7.5pt;color:#94a3b8;margin:3px 0 0">${sub}</p></div></div>`;
      }).join("")}
    </div>
  </div>

</div>`;
}

interface BuildBatchPrintHtmlParams {
  students: BulletinStudent[];
  trimestre: Trimestre;
  classLabel: string;
  gradesMap: Record<string, Record<string, GradeSet>>;
  gradeSchema: Record<string, number>;
  computedRanks: Record<string, number>;
  domains: DomainConfig[];
  getStudentGrades: (id: string) => Record<string, GradeSet>;
  getAttendance: (studentId: string, count: number) => Array<"P" | "ANJ" | "AJ" | "R">;
}

// Combines all student pages into a self-contained HTML document.
// Pure string concatenation — zero DOM, zero React fiber operations.
export function buildBatchPrintHtml({
  students,
  trimestre,
  classLabel,
  gradesMap,
  gradeSchema,
  computedRanks,
  domains,
  getStudentGrades,
  getAttendance,
}: BuildBatchPrintHtmlParams): string {
  const trimLabel = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";
  const pages = students.map(s => {
    const g = gradesMap[s.id] ?? getStudentGrades(s.id);
    const nj3 = totalAbsencesNJ(getAttendance(s.id, 20));
    return buildOneBulletinHtml({
      student: s,
      grades: g,
      trimestre,
      classLabel,
      schema: gradeSchema,
      rank: computedRanks[s.id] ?? 0,
      absNJ: nj3,
      domains,
    });
  });

  return [
    "<!DOCTYPE html><html lang='fr'>",
    "<head><meta charset='utf-8'>",
    `<title>Bulletins CE2 · ${trimLabel} Trimestre</title>`,
    `<style>${BATCH_PRINT_CSS}</style>`,
    "</head><body>",
    pages.join(""),
    "</body></html>",
  ].join("");
}