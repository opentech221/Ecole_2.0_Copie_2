import { useState } from "react";
import {
  CreditCard, Check, X, ChevronDown, ChevronUp,
  Zap, Shield, Star, MessageCircle, Phone,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENT_PLAN = "gratuit";

const PLANS = [
  {
    id:       "gratuit",
    name:     "Découverte",
    price:    "0",
    period:   "Gratuit",
    color:    "var(--muted-foreground)",
    bg:       "var(--card)",
    border:   "var(--border)",
    badge:    null,
    features: [
      { label: "5 fiches de préparation/mois",      ok: true  },
      { label: "40 élèves maximum",                  ok: true  },
      { label: "Cahier journal basique",             ok: true  },
      { label: "Export PDF",                         ok: false },
      { label: "Fiches illimitées",                  ok: false },
      { label: "Coach IA",                           ok: false },
      { label: "Support prioritaire",                ok: false },
    ],
  },
  {
    id:       "pro",
    name:     "Enseignant Pro",
    price:    "2 500",
    period:   "FCFA / mois",
    color:    "var(--primary)",
    bg:       "var(--accent)",
    border:   "var(--primary)",
    badge:    "Recommandé",
    features: [
      { label: "Fiches illimitées",                  ok: true  },
      { label: "100 élèves maximum",                 ok: true  },
      { label: "Export PDF haute qualité",           ok: true  },
      { label: "Coach IA basique",                   ok: true  },
      { label: "Bulletins de notes",                 ok: true  },
      { label: "Multi-classes",                      ok: false },
      { label: "Support prioritaire",                ok: false },
    ],
  },
  {
    id:       "premium",
    name:     "École Premium",
    price:    "7 500",
    period:   "FCFA / mois",
    color:    "var(--accent-foreground)",
    bg:       "var(--muted)",
    border:   "var(--accent-foreground)",
    badge:    "Complet",
    features: [
      { label: "Fiches illimitées",                  ok: true  },
      { label: "Élèves illimités",                   ok: true  },
      { label: "Multi-classes & multi-enseignants",  ok: true  },
      { label: "Coach IA avancé",                    ok: true  },
      { label: "Rapports de direction",              ok: true  },
      { label: "Personnalisation logo école",        ok: true  },
      { label: "Support prioritaire 24h/24",         ok: true  },
    ],
  },
];

const FAQ = [
  {
    q: "Comment puis-je payer ?",
    a: "Nous acceptons Orange Money, Wave, Free Money et les cartes bancaires Visa/Mastercard. Le paiement est 100% sécurisé.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, vous pouvez résilier votre abonnement à tout moment depuis cette page. Vous conservez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Mon accès est-il disponible sur plusieurs appareils ?",
    a: "Oui. Votre compte fonctionne sur tous vos appareils (téléphone, tablette, ordinateur). Vos données sont synchronisées en temps réel.",
  },
  {
    q: "Que se passe-t-il si j'atteins la limite de fiches ?",
    a: "Vous recevez une notification à 80% d'utilisation. Vous pouvez passer au niveau supérieur à tout moment pour continuer sans interruption.",
  },
];

// ─── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, isCurrent }: { plan: typeof PLANS[0]; isCurrent: boolean }) {
  const FF = "'Plus Jakarta Sans', sans-serif";
  return (
    <div style={{
      borderRadius:    "16px",
      border:          `2px solid ${isCurrent ? plan.color : plan.border}`,
      backgroundColor: plan.bg,
      padding:         "24px 20px",
      position:        "relative",
      boxShadow:       isCurrent
        ? `0 8px 32px ${plan.color}22`
        : "0 2px 8px rgba(0,0,0,0.05)",
      transition:      "box-shadow 200ms",
    }}>
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position:        "absolute", top: "-12px", left: "50%",
          transform:       "translateX(-50%)",
          backgroundColor: plan.color, color: "#fff",
          fontSize: "10px", fontWeight: 800, padding: "3px 12px",
          borderRadius: "999px", letterSpacing: "0.05em",
          fontFamily: FF,
        }}>
          {plan.badge}
        </div>
      )}

      {isCurrent && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          backgroundColor: plan.color + "18",
          color: plan.color, fontSize: "10px", fontWeight: 700,
          padding: "2px 10px", borderRadius: "999px",
          fontFamily: FF,
        }}>
          Actuel
        </div>
      )}

      <p style={{ fontSize: "13px", fontWeight: 700, color: plan.color,
                  margin: "0 0 4px", fontFamily: FF }}>
        {plan.name}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px" }}>
        <span style={{ fontSize: "28px", fontWeight: 900, color: "var(--foreground)", fontFamily: FF }}>
          {plan.price}
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: FF }}>
          {plan.period}
        </span>
      </div>

      {/* Features */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex",
                   flexDirection: "column", gap: "8px" }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {f.ok
              ? <Check style={{ width: 14, height: 14, color: "var(--secondary)", flexShrink: 0 }} />
              : <X    style={{ width: 14, height: 14, color: "var(--muted-foreground)", flexShrink: 0 }} />}
            <span style={{ fontSize: "12.5px", color: f.ok ? "var(--foreground)" : "var(--muted-foreground)",
                           fontFamily: FF }}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button style={{
        width:           "100%",
        padding:         "10px",
        borderRadius:    "10px",
        fontSize:        "13px",
        fontWeight:      700,
        cursor:          isCurrent ? "default" : "pointer",
        border:          "none",
        backgroundColor: isCurrent ? "var(--muted)" : plan.color,
        color:           isCurrent ? "var(--muted-foreground)" : "var(--primary-foreground)",
        fontFamily:      FF,
      }}>
        {isCurrent ? "Offre actuelle" : "Passer à ce niveau"}
      </button>
    </div>
  );
}

// ─── FAQ item ──────────────────────────────────────────────────────────────────

let _faqCounter = 0;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  // Stable unique ID for aria-controls / id pairing
  const [panelId]       = useState(() => `faq-panel-${++_faqCounter}`);
  const FF = "'Plus Jakarta Sans', sans-serif";
  return (
    <div style={{
      borderRadius: "12px", border: "1px solid var(--border)",
      backgroundColor: "var(--card)", overflow: "hidden",
    }}>
      {/* A09 fix: aria-expanded + aria-controls for screen-reader state */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
          fontFamily: FF,
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>{q}</span>
        {open
          ? <ChevronUp   style={{ width: 16, height: 16, color: "var(--muted-foreground)", flexShrink: 0 }}
                         aria-hidden="true" />
          : <ChevronDown style={{ width: 16, height: 16, color: "var(--muted-foreground)", flexShrink: 0 }}
                         aria-hidden="true" />}
      </button>
      <div
        id={panelId}
        hidden={!open}
        style={{ padding: open ? "0 16px 14px" : undefined }}
      >
        <p style={{ fontSize: "12.5px", color: "var(--muted-foreground)", lineHeight: 1.65,
                    margin: 0, fontFamily: FF }}>
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export function AbonnementScreen() {
  const FF = "'Plus Jakarta Sans', sans-serif";

  return (
    <div style={{ backgroundColor: "var(--muted)", minHeight: "100vh",
                  fontFamily: FF }}>

      {/* Page header */}
      <div style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)",
                    padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CreditCard style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
              Mon Abonnement
            </h1>
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: 0 }}>
              Gérez votre offre et votre facturation
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Current plan banner */}
        <div style={{
          backgroundColor: "var(--accent)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "16px 20px", marginBottom: "24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px", flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "10px",
              backgroundColor: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--secondary)", fontWeight: 600, margin: 0 }}>
                Offre actuelle
              </p>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
                Plan Découverte
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: "0 0 2px" }}>
              Renouvellement
            </p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Gratuit
            </p>
          </div>
        </div>

        {/* Pricing grid */}
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    margin: "0 0 12px 4px" }}>
          Choisir une offre
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          {PLANS.map(p => (
            <PlanCard key={p.id} plan={p} isCurrent={p.id === CURRENT_PLAN} />
          ))}
        </div>

        {/* Usage stats */}
        <div style={{
          backgroundColor: "var(--card)", borderRadius: "14px",
          border: "1px solid var(--border)", padding: "20px",
          marginBottom: "24px",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)",
                      margin: "0 0 16px" }}>
            Utilisation ce mois-ci
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Fiches créées",    value: 3,  max: 5,   color: "var(--secondary)" },
              { label: "Élèves enregistrés", value: 28, max: 40, color: "#059669" },
            ].map(({ label, value, max, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between",
                              marginBottom: "5px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground)" }}>
                    {value} / {max}
                  </span>
                </div>
                <div style={{ height: "6px", borderRadius: "999px",
                              backgroundColor: "var(--muted)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "999px",
                    backgroundColor: color,
                    width: `${(value / max) * 100}%`,
                    transition: "width 600ms ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      margin: "0 0 12px 4px" }}>
            Questions fréquentes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {FAQ.map((f, i) => <FaqItem key={i} {...f} />)}
          </div>
        </div>

        {/* WhatsApp support */}
        <div style={{
          backgroundColor: "#f0fdf4", border: "1px solid #86efac",
          borderRadius: "14px", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "12px",
            backgroundColor: "#25d366",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <MessageCircle style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#14532d", margin: 0 }}>
              Besoin d'aide pour le paiement ?
            </p>
            <p style={{ fontSize: "12px", color: "#166534", margin: "2px 0 0", lineHeight: 1.5 }}>
              Notre équipe vous répond sur WhatsApp en moins de 2h, du lundi au samedi.
            </p>
          </div>
          <a
            href="https://wa.me/221770000000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "6px",
              padding:         "9px 16px",
              borderRadius:    "10px",
              backgroundColor: "#25d366",
              color:           "#fff",
              fontSize:        "12px",
              fontWeight:      700,
              textDecoration:  "none",
              flexShrink:      0,
              fontFamily:      FF,
            }}
          >
            <Phone style={{ width: 13, height: 13 }} />
            Contacter
          </a>
        </div>

      </div>
    </div>
  );
}
