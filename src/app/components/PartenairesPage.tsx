import { ExternalLink } from "lucide-react";

const PARTENAIRES = [
  {
    nom: "InTech Sénégal",
    description: "Solutions technologiques pour l'éducation",
    site: "https://www.intech.sn",
    couleur: "#1a365d",
    initiales: "IT",
  },
  {
    nom: "Ministère de l'Éducation",
    description: "Direction de l'Enseignement Élémentaire",
    site: "https://www.education.gouv.sn",
    couleur: "#065f46",
    initiales: "ME",
  },
  {
    nom: "IEF Kolda",
    description: "Inspection de l'Éducation et de la Formation",
    site: null,
    couleur: "#7c3aed",
    initiales: "IEF",
  },
  {
    nom: "Tech-Loxo",
    description: "Développement de solutions numériques scolaires",
    site: "https://www.tech-loxo.sn",
    couleur: "#b45309",
    initiales: "TL",
  },
];

export function PartenairesPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: "0 0 4px" }}>
          Nos Partenaires
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
          Organisations et institutions partenaires de la plateforme École 2.0.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {PARTENAIRES.map(p => (
          <div key={p.nom} style={{
            backgroundColor: "var(--card)", borderRadius: 14, border: "1px solid var(--border)",
            padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              backgroundColor: p.couleur,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff",
            }}>
              {p.initiales}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: "0 0 3px" }}>
                {p.nom}
              </p>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 10px" }}>
                {p.description}
              </p>
              {p.site && (
                <a href={p.site} target="_blank" rel="noopener noreferrer"
                   style={{
                     display: "inline-flex", alignItems: "center", gap: 4,
                     fontSize: 11, fontWeight: 600, color: "var(--primary)",
                     textDecoration: "none",
                   }}>
                  <ExternalLink style={{ width: 11, height: 11 }} />
                  Visiter le site
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 32, padding: "16px 20px", borderRadius: 12,
        backgroundColor: "var(--muted)", border: "1px solid var(--border)",
        fontSize: 12, color: "var(--muted-foreground)", textAlign: "center",
      }}>
        Vous souhaitez devenir partenaire ? Contactez-nous via la page{" "}
        <a href="/assistance" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
          Assistance
        </a>.
      </div>
    </div>
  );
}
