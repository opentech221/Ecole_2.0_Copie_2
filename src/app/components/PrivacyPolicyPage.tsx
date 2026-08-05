import { Link } from "react-router";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(145deg, #0d1f3c 0%, #0f8d46 45%, #bf1e2e 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "clamp(14px, 4vw, 24px)",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "860px",
  backgroundColor: "var(--card)",
  borderRadius: "20px",
  padding: "clamp(20px, 4vw, 32px)",
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
  color: "var(--muted-foreground)",
  lineHeight: 1.7,
  fontSize: "14px",
};

export function PrivacyPolicyPage() {
  return (
    <div style={shell}>
      <article style={card}>
        <h1 style={{ margin: 0, color: "var(--foreground)", fontSize: "28px", fontWeight: 900 }}>
          Politique de confidentialité
        </h1>
        <p style={{ ...p, marginTop: "10px" }}>
          Dernière mise à jour : 05 juillet 2026
        </p>

        <p style={p}>
          Cette politique explique quelles données sont collectées dans Ecole 2.0,
          pourquoi elles sont utilisees et comment vous pouvez exercer vos droits.
        </p>

        <h2 style={h2}>1) Données collectées</h2>
        <p style={p}>
          Nous pouvons traiter les informations de compte (nom, email, numéro de téléphone),
          des données pédagogiques (classes, élèves, notes, documents) et des journaux techniques
          nécessaires à la sécurité et au bon fonctionnement du service.
        </p>

        <h2 style={h2}>2) Finalites du traitement</h2>
        <p style={p}>
          Les données sont utilisées pour authentifier les utilisateurs, fournir les fonctionnalités
          de gestion scolaire, sécuriser l'accès aux ressources et améliorer la qualité du service.
        </p>

        <h2 style={h2}>3) Base technique et sous-traitants</h2>
        <p style={p}>
          L'application s'appuie sur Supabase pour l'authentification et la base de données.
          Les données peuvent être hébergées et traitées par des prestataires techniques associés
          a cette infrastructure.
        </p>

        <h2 style={h2}>4) Conservation</h2>
        <p style={p}>
          Les données sont conservées pendant la durée nécessaire à la fourniture du service,
          puis supprimees ou anonymisees selon les obligations legales applicables.
        </p>

        <h2 style={h2}>5) Vos droits</h2>
        <p style={p}>
          Vous pouvez demander l'accès, la rectification ou la suppression de vos données.
          Pour exercer vos droits, utilisez la page de suppression de données et les canaux
          de support officiels de l'application.
        </p>

        <h2 style={h2}>6) Sécurité</h2>
        <p style={p}>
          Des mesures de sécurité techniques et organisationnelles sont appliquées,
          notamment des contrôles d'accès, des politiques de sécurité basées sur les rôles
          et des restrictions d'accès aux données.
        </p>

        <h2 style={h2}>7) Contact</h2>
        <p style={p}>
          Pour toute question relative à la confidentialité, contactez l'équipe via les canaux
          de contact du projet Ecole 2.0.
        </p>

        <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            to="/data-deletion"
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "var(--accent)",
              border: "1px solid color-mix(in srgb, var(--secondary) 20%, transparent)",
              color: "var(--secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Voir la suppression des données
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
            Retour à la connexion
          </Link>
        </div>
      </article>
    </div>
  );
}
