import { Mail, Phone, Globe, MapPin, MessageCircle } from "lucide-react";

const CONTACTS = [
  { Icon: Mail,    label: "Email",    value: "contact@tech-loxo.com",        href: "mailto:contact@tech-loxo.com" },
  { Icon: Phone,   label: "Téléphone 1", value: "(+221) 78 535 19 91",       href: "tel:+221785351991" },
  { Icon: Phone,   label: "Téléphone 2", value: "(+221) 77 100 78 50",       href: "tel:+221771007850" },
  { Icon: Globe,   label: "Site web",  value: "www.tech-loxo.sn",            href: "https://www.tech-loxo.sn" },
  { Icon: MapPin,  label: "Adresse",   value: "Sébikotane, Quartier Carrière, en face du Lycée de Sébikotane, près de la Gare du TER.", href: null },
];

export function AssistancePage() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--foreground)", margin: "0 0 4px" }}>
          Assistance
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
          Notre équipe est disponible pour vous aider.
        </p>
      </div>

      {/* Contact card */}
      <div style={{
        backgroundColor: "var(--card)", borderRadius: 16, border: "1px solid var(--border)",
        overflow: "hidden", marginBottom: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
          padding: "20px 24px",
        }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
            Assistance Tech-Loxo
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            Éditeur de la plateforme École 2.0
          </p>
        </div>

        {/* Contacts list */}
        <div style={{ padding: "8px 0" }}>
          {CONTACTS.map(({ Icon, label, value, href }) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                backgroundColor: "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ width: 15, height: 15, color: "var(--primary)" }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)",
                             textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>
                  {label}
                </p>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                     style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)",
                              textDecoration: "none" }}>
                    {value}
                  </a>
                ) : (
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", margin: 0 }}>
                    {value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp CTA */}
      <a href="https://wa.me/221785351991" target="_blank" rel="noopener noreferrer"
         style={{
           display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
           padding: "14px 20px", borderRadius: 12, textDecoration: "none",
           background: "#25d366", color: "#fff",
           fontSize: 14, fontWeight: 700,
           boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
         }}>
        <MessageCircle style={{ width: 18, height: 18 }} />
        Contacter via WhatsApp
      </a>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted-foreground)",
                  marginTop: 24 }}>
        Version 1.0 · École 2.0 par Tech-Loxo
      </p>
    </div>
  );
}
