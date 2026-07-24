import { Link } from "react-router";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(145deg, #0d1f3c 0%, #1a365d 60%, #2d4a7a 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "860px",
  backgroundColor: "#fff",
  borderRadius: "20px",
  padding: "32px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
};

const h2: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 800,
  color: "#14532d",
  margin: "22px 0 8px",
};

const p: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#334155",
  lineHeight: 1.7,
  fontSize: "14px",
};

export function DataDeletionPage() {
  return (
    <div style={shell}>
      <article style={card}>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: "28px", fontWeight: 900 }}>
          Suppression des données utilisateur
        </h1>
        <p style={{ ...p, marginTop: "10px", color: "#64748b" }}>
          Dernière mise à jour : 05 juillet 2026
        </p>

        <p style={p}>
          Cette page explique comment demander la suppression de votre compte et des données
          associees dans Ecole 2.0.
        </p>

        <h2 style={h2}>1) Qui peut faire la demande</h2>
        <p style={p}>
          Le titulaire du compte (ou un représentant autorisé de l'établissement) peut demander
          la suppression complete du compte utilisateur.
        </p>

        <h2 style={h2}>2) Informations à fournir</h2>
        <p style={p}>
          Pour traiter la demande, fournissez au minimum l'identifiant utilisé pour la connexion
          (email ou numéro de téléphone) ainsi que le nom de l'établissement associé.
        </p>

        <h2 style={h2}>3) Délai de traitement</h2>
        <p style={p}>
          Les demandes sont traitées dans un délai raisonnable, généralement sous 30 jours,
          sous reserve de verification d'identite.
        </p>

        <h2 style={h2}>4) Données supprimées</h2>
        <p style={p}>
          La suppression peut inclure les informations de profil, les données de session,
          les documents associés au compte et les données pédagogiques rattachées, sauf obligations
          legales de conservation.
        </p>

        <h2 style={h2}>5) Données conservées</h2>
        <p style={p}>
          Certaines données minimales peuvent être conservées temporairement pour la sécurité,
          la prévention des abus ou le respect d'obligations légales et réglementaires.
        </p>

        <h2 style={h2}>6) Comment envoyer la demande</h2>
        <p style={p}>
          Envoyez votre demande de suppression via le canal de support officiel du projet.
          Indiquez "Demande de suppression de données" dans l'objet du message.
        </p>

        <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/privacy-policy"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Voir la politique de confidentialité
          </Link>
          <Link
            to="/login"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "#0f172a",
              border: "1px solid #0f172a",
              color: "#fff",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Retour à la connexion
          </Link>
        </div>
      </article>
    </div>
  );
}
