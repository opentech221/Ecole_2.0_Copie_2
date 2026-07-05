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
  color: "#1e3a8a",
  margin: "22px 0 8px",
};

const p: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#334155",
  lineHeight: 1.7,
  fontSize: "14px",
};

export function PrivacyPolicyPage() {
  return (
    <div style={shell}>
      <article style={card}>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: "28px", fontWeight: 900 }}>
          Politique de confidentialite
        </h1>
        <p style={{ ...p, marginTop: "10px", color: "#64748b" }}>
          Derniere mise a jour: 05 juillet 2026
        </p>

        <p style={p}>
          Cette politique explique quelles donnees sont collecteess dans Ecole 2.0,
          pourquoi elles sont utilisees et comment vous pouvez exercer vos droits.
        </p>

        <h2 style={h2}>1) Donnees collecteess</h2>
        <p style={p}>
          Nous pouvons traiter les informations de compte (nom, email, numero de telephone),
          des donnees pedagogiques (classes, eleves, notes, documents) et des journaux techniques
          necessaires a la securite et au bon fonctionnement du service.
        </p>

        <h2 style={h2}>2) Finalites du traitement</h2>
        <p style={p}>
          Les donnees sont utilisees pour authentifier les utilisateurs, fournir les fonctionnalites
          de gestion scolaire, securiser l'acces aux ressources et ameliorer la qualite du service.
        </p>

        <h2 style={h2}>3) Base technique et sous-traitants</h2>
        <p style={p}>
          L'application s'appuie sur Supabase pour l'authentification et la base de donnees.
          Les donnees peuvent etre hebergees et traitees par des prestataires techniques associes
          a cette infrastructure.
        </p>

        <h2 style={h2}>4) Conservation</h2>
        <p style={p}>
          Les donnees sont conservees pendant la duree necessaire a la fourniture du service,
          puis supprimees ou anonymisees selon les obligations legales applicables.
        </p>

        <h2 style={h2}>5) Vos droits</h2>
        <p style={p}>
          Vous pouvez demander l'acces, la rectification ou la suppression de vos donnees.
          Pour exercer vos droits, utilisez la page de suppression de donnees et les canaux
          de support officiels de l'application.
        </p>

        <h2 style={h2}>6) Securite</h2>
        <p style={p}>
          Des mesures de securite techniques et organisationnelles sont appliquees,
          notamment des controles d'acces, des politiques de securite basees sur les roles
          et des restrictions d'acces aux donnees.
        </p>

        <h2 style={h2}>7) Contact</h2>
        <p style={p}>
          Pour toute question relative a la confidentialite, contactez l'equipe via les canaux
          de contact du projet Ecole 2.0.
        </p>

        <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/data-deletion"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Voir la suppression des donnees
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
            Retour a la connexion
          </Link>
        </div>
      </article>
    </div>
  );
}
