import { Link } from "react-router";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(145deg, var(--primary) 0%, var(--secondary) 60%, color-mix(in srgb, var(--secondary) 70%, var(--primary)) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "860px",
  backgroundColor: "var(--card)",
  borderRadius: "20px",
  padding: "32px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
};

const h2: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 800,
  color: "var(--secondary)",
  margin: "22px 0 8px",
};

const p: React.CSSProperties = {
  margin: "0 0 10px",
  color: "var(--foreground)",
  lineHeight: 1.7,
  fontSize: "14px",
};

export function DataDeletionPage() {
  return (
    <div style={shell}>
      <article style={card}>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: "28px", fontWeight: 900 }}>
          Suppression des donnees utilisateur
        </h1>
        <p style={{ ...p, marginTop: "10px", color: "#64748b" }}>
          Derniere mise a jour: 05 juillet 2026
        </p>

        <p style={p}>
          Cette page explique comment demander la suppression de votre compte et des donnees
          associees dans Ecole 2.0.
        </p>

        <h2 style={h2}>1) Qui peut faire la demande</h2>
        <p style={p}>
          Le titulaire du compte (ou un representant autorise de l'etablissement) peut demander
          la suppression complete du compte utilisateur.
        </p>

        <h2 style={h2}>2) Informations a fournir</h2>
        <p style={p}>
          Pour traiter la demande, fournissez au minimum l'identifiant utilise pour la connexion
          (email ou numero de telephone) ainsi que le nom de l'etablissement associe.
        </p>

        <h2 style={h2}>3) Delai de traitement</h2>
        <p style={p}>
          Les demandes sont traitees dans un delai raisonnable, generalement sous 30 jours,
          sous reserve de verification d'identite.
        </p>

        <h2 style={h2}>4) Donnees supprimees</h2>
        <p style={p}>
          La suppression peut inclure les informations de profil, les donnees de sessions,
          les documents associes au compte et les donnees pedagogiques rattachees, sauf obligations
          legales de conservation.
        </p>

        <h2 style={h2}>5) Donnees conservees</h2>
        <p style={p}>
          Certaines donnees minimales peuvent etre conservees temporairement pour la securite,
          la prevention des abus ou le respect d'obligations legales et reglementaires.
        </p>

        <h2 style={h2}>6) Comment envoyer la demande</h2>
        <p style={p}>
          Envoyez votre demande de suppression via le canal de support officiel du projet.
          Indiquez "Demande de suppression de donnees" dans l'objet du message.
        </p>

        <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/privacy-policy"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "var(--accent)",
              border: "1px solid var(--border)",
              color: "var(--secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Voir la politique de confidentialite
          </Link>
          <Link
            to="/login"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "var(--primary)",
              border: "1px solid var(--primary)",
              color: "#fff",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Retour a la connexion
          </Link>
        </div>
      </article>
    </div>
  );
}
