import { useNavigate } from "react-router";
import {
  Mail, Phone, Globe, MapPin,
  HelpCircle, FileText, Shield, Info,
  LogOut, ChevronRight,
} from "lucide-react";
import { signOut } from "../../hooks/useAuth";

const MENU_ITEMS = [
  { Icon: HelpCircle, label: "Aide & Support",       path: "/app/assistance#aide" },
  { Icon: FileText,   label: "Conditions Générales", path: "/app/assistance#cgu"  },
  { Icon: Shield,     label: "Confidentialité",      path: "/privacy-policy"  },
  { Icon: Info,       label: "À propos",             path: "/app/assistance#about"},
];

const CONTACTS = [
  { Icon: Mail,    value: "contact@tech-loxo.com",                                href: "mailto:contact@tech-loxo.com" },
  { Icon: Phone,   value: "(+221) 78 535 19 91",                                  href: "tel:+221785351991" },
  { Icon: Phone,   value: "(+221) 77 100 78 50",                                  href: "tel:+221771007850" },
  { Icon: Globe,   value: "www.tech-loxo.sn",                                     href: "https://www.tech-loxo.sn" },
  { Icon: MapPin,  value: "Sébikotane, Quartier Carrière, en face du Lycée de Sébikotane, près de la Gare du TER.", href: null },
];

const PARTENAIRES = [
  { initiales: "iN", bg: "#1a4e8f", label: "iNTech" },
  { initiales: "DS", bg: "#4a7c59", label: "DEN Sénégal" },
  { initiales: "BS", bg: "#2563eb", label: "BSSS" },
  { initiales: "TG", bg: "#b45309", label: "TopGames" },
  { initiales: "TL", bg: "#111827", label: "Tech-Loxo" },
];

const ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 16,
  padding: "14px 0", borderBottom: "1px solid var(--border)",
  cursor: "pointer", background: "none", border: "none",
  width: "100%", textAlign: "left",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

import React from "react";

export function AssistancePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px 40px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Menu items ── */}
      <div style={{ marginBottom: 32 }}>
        {MENU_ITEMS.map(({ Icon, label, path }) => (
          <button key={label}
            onClick={() => navigate(path)}
            style={{ ...ROW, borderBottom: "1px solid var(--border)" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              border: "2px solid var(--primary)", backgroundColor: "var(--muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon style={{ width: 18, height: 18, color: "var(--primary)" }} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>
              {label}
            </span>
            <ChevronRight style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
          </button>
        ))}
      </div>

      {/* ── Assistance contact ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)",
                    margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Assistance Tech-Loxo
        </p>
        {CONTACTS.map(({ Icon, value, href }) => (
          <div key={value} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "10px 0", borderBottom: "1px solid var(--border)",
          }}>
            <Icon style={{ width: 16, height: 16, color: "var(--muted-foreground)",
                           flexShrink: 0, marginTop: 2 }} />
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer"
                 style={{ fontSize: 14, color: "var(--foreground)", textDecoration: "none" }}>
                {value}
              </a>
            ) : (
              <p style={{ fontSize: 14, color: "var(--foreground)", margin: 0 }}>{value}</p>
            )}
          </div>
        ))}
        <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 10 }}>
          Version 1.0.0
        </p>
      </div>

      {/* ── Separator ── */}
      <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 24 }} />

      {/* ── Nos Partenaires ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)",
                    margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          Nos Partenaires
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {PARTENAIRES.map(p => (
            <div key={p.label} title={p.label} style={{
              width: 54, height: 54, borderRadius: "50%",
              backgroundColor: p.bg,
              border: "2px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff",
              flexShrink: 0,
            }}>
              {p.initiales}
            </div>
          ))}
        </div>
      </div>

      {/* ── Separator ── */}
      <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 24 }} />

      {/* ── Se Déconnecter ── */}
      <button
        onClick={handleLogout}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "15px 20px",
          borderRadius: 50, border: "2px solid #ef4444",
          backgroundColor: "transparent", color: "#ef4444",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: "background 160ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <LogOut style={{ width: 17, height: 17 }} />
        Se Déconnecter
      </button>
    </div>
  );
}

