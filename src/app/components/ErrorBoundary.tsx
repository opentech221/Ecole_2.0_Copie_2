import { useRouteError, isRouteErrorResponse } from "react-router";

export default function ErrorBoundary() {
  const error = useRouteError();

  const message =
    isRouteErrorResponse(error)
      ? `${error.status} — ${error.statusText}`
      : error instanceof Error
        ? error.message
        : "Erreur inconnue";

  return (
    <>
      {/* Ensure this component is NEVER captured by the print stream.
          The embedded @media print rule is self-contained so it applies
          even when the error boundary renders on a route that has no other
          print CSS (e.g. a top-level crash before any screen mounts).     */}
      <style>{`
        @media print {
          .ecole-error-boundary { display: none !important; }
        }
      `}</style>

      <div
        className="ecole-error-boundary no-print"
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          minHeight:      "100vh",
          padding:        "40px 20px",
          backgroundColor:"var(--background)",
          fontFamily:     "'Plus Jakarta Sans', sans-serif",
          textAlign:      "center",
        }}
      >
        {/* Icon */}
        <div style={{
          width:           "64px",
          height:          "64px",
          borderRadius:    "50%",
          backgroundColor: "var(--accent)",
          border:          "2px solid var(--border)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          marginBottom:    "20px",
          fontSize:        "28px",
        }}>
          ⚠️
        </div>

        <h2 style={{ fontSize:"20px", fontWeight:800, color:"var(--primary)", margin:"0 0 8px" }}>
          Une erreur est survenue
        </h2>

        <p style={{ fontSize:"14px", color:"var(--muted-foreground)", margin:"0 0 6px", maxWidth:"480px" }}>
          L'application a rencontré un problème technique. Vos données sont en sécurité.
        </p>

        {message && (
          <p style={{
            fontSize:        "11px",
            color:           "var(--muted-foreground)",
            margin:          "0 0 28px",
            maxWidth:        "480px",
            fontFamily:      "monospace",
            backgroundColor: "var(--card)",
            padding:         "6px 12px",
            borderRadius:    "6px",
            wordBreak:       "break-word",
          }}>
            {message}
          </p>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            minHeight:       "44px",
            padding:         "0 24px",
            borderRadius:    "12px",
            backgroundColor: "var(--primary)",
            color:           "#fff",
            fontFamily:      "'Plus Jakarta Sans', sans-serif",
            fontWeight:      700,
            fontSize:        "14px",
            border:          "none",
            cursor:          "pointer",
            boxShadow:       "0 4px 14px color-mix(in srgb, var(--primary) 28%, transparent)",
          }}
        >
          Recharger la page
        </button>
      </div>
    </>
  );
}
