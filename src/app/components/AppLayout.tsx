import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import {
  LayoutDashboard, CalendarDays, BarChart3, BookOpenText,
  FileText, CreditCard, Settings, UserCircle,
  LogOut, GraduationCap, Menu, X, AlertTriangle, ChevronRight,
  Check, Plus,
} from "lucide-react";
import { useAppContext, ALL_CLASSES, UserRole } from "../contexts/AppContext";
import { useAuthContext }                        from "../contexts/AuthContext";
import { signOut }                               from "../../hooks/useAuth";
import type { UserProfile }                      from "../../hooks/useAuth";

// ─── Utilities ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2)
    .map(w => w[0]).join("").toUpperCase();
}

// ─── Navigation definitions ───────────────────────────────────────────────────

const MAIN_NAV = [
  { path: "/",           Icon: LayoutDashboard, label: "Tableau de bord"       },
  { path: "/planning",   Icon: CalendarDays,    label: "Planification"          },
  { path: "/eleves",     Icon: BarChart3,       label: "Administration & Suivi" },
  { path: "/cahier",     Icon: BookOpenText,    label: "Journal & Registre"     },
  { path: "/documents",  Icon: FileText,        label: "Documents"              },
  { path: "/abonnement", Icon: CreditCard,      label: "Abonnement"             },
  { path: "/parametres", Icon: Settings,        label: "Paramètres"             },
  { path: "/profil",     Icon: UserCircle,      label: "Profil"                 },
];

const BOTTOM_NAV = [
  { path: "/",          Icon: LayoutDashboard, label: "Accueil"   },
  { path: "/eleves",    Icon: BarChart3,       label: "Admin"     },
  { path: "/documents", Icon: FileText,        label: "Documents" },
];

// Routes exempt from the profile-completion guard
const GUARD_EXEMPT = ["/profil", "/parametres", "/abonnement"];

// ─── Active nav style ─────────────────────────────────────────────────────────

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: "10px",
    width: "100%", padding: "9px 12px 9px 14px",
    borderRadius: "10px", fontSize: "13px",
    fontWeight:      active ? 600 : 400,
    color:           active ? "#059669" : "#475569",
    backgroundColor: active ? "#ecfdf5" : "transparent",
    boxShadow:       active ? "inset 3px 0 0 #059669" : "inset 3px 0 0 transparent",
    cursor: "pointer", border: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "background-color 140ms, color 140ms",
    textAlign: "left",
  };
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function SchoolAlertCard({ onGo }: { onGo: () => void }) {
  return (
    <div style={{
      margin: "0 12px 4px", padding: "10px 12px", borderRadius: "10px",
      backgroundColor: "#fffbeb", border: "1px solid #fde68a",
    }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <AlertTriangle style={{ width: 13, height: 13, color: "#d97706",
                                 flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#92400e",
                      margin: "0 0 4px", lineHeight: 1.4,
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Données école manquantes
          </p>
          <p style={{ fontSize: "11px", color: "#b45309", margin: "0 0 7px",
                      lineHeight: 1.45, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Configurez votre école pour générer vos fiches.
          </p>
          <button
            onClick={onGo}
            style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              fontSize: "11px", fontWeight: 700, color: "#92400e",
              backgroundColor: "#fef3c7", border: "1px solid #fcd34d",
              borderRadius: "6px", padding: "3px 10px", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Aller au profil <ChevronRight style={{ width: 10, height: 10 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User card (bottom of sidebar) ───────────────────────────────────────────

function UserCard({ profile, onLogout }: { profile: UserProfile | null; onLogout: () => void }) {
  const [hover, setHover] = useState(false);
  const displayName = profile?.fullName || "Enseignant";
  const displayRole = profile?.role === "director" ? "Directeur" : "Enseignant";
  const initials    = getInitials(displayName);

  return (
    <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px",
                    padding: "6px 8px", marginBottom: "6px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 700, color: "#fff",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b",
                      margin: 0, overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {displayName}
          </p>
          <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {displayRole}
          </p>
        </div>
      </div>

      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          width: "100%", padding: "7px 12px", borderRadius: "8px",
          fontSize: "12px", fontWeight: 500,
          color:           hover ? "#ef4444" : "#94a3b8",
          backgroundColor: hover ? "#fff1f2" : "transparent",
          border:          `1px solid ${hover ? "#fecaca" : "#f1f5f9"}`,
          cursor: "pointer", transition: "all 160ms ease",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <LogOut style={{ width: 13, height: 13 }} />
        Déconnexion
      </button>
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar({ profile, onLogout }: {
  profile: UserProfile | null; onLogout: () => void;
}) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const schoolMissing = !profile?.ecoleName?.trim();
  const { activeClass, setActiveClass } = useAppContext();
  const [classOpen, setClassOpen] = useState(false);
  const classRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (classRef.current && !classRef.current.contains(e.target as Node))
        setClassOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside style={{
      width: "260px", minWidth: "260px",
      backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0, overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 16px 14px", borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "8px", flexShrink: 0,
          background: "linear-gradient(135deg, #0d1f3c 0%, #3182ce 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GraduationCap style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a",
                      margin: 0, letterSpacing: "-0.01em",
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            École 2.0
          </p>
          <p style={{ fontSize: "10.5px", color: "#94a3b8", margin: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {profile?.ecoleName || "Plateforme scolaire"}
          </p>
        </div>
      </div>

      {/* Nouvelle Fiche CTA */}
      <div style={{ padding: "12px 12px 4px" }}>
        <button
          onClick={() => navigate("/new-fiche")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            width: "100%", padding: "10px 14px", borderRadius: "10px",
            background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            color: "#fff", fontWeight: 700, fontSize: "13px",
            border: "none", cursor: "pointer",
            boxShadow: "0 3px 10px rgba(5,150,105,0.28)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Plus style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
          Nouvelle Fiche
        </button>
      </div>

      {/* Class selector */}
      <div style={{ padding: "8px 12px 4px" }} ref={classRef}>
        <button
          onClick={() => setClassOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "7px 11px", borderRadius: "8px",
            backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
            Classe active :
          </span>
          <span style={{
            fontSize: "12px", fontWeight: 800, color: "#059669",
            backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0",
            borderRadius: "5px", padding: "1px 8px",
          }}>
            {activeClass}
          </span>
        </button>
        {classOpen && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px",
            marginTop: "6px", padding: "8px",
            backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0",
          }}>
            {ALL_CLASSES.map(c => {
              const a = activeClass === c;
              return (
                <button key={c} onClick={() => { setActiveClass(c); setClassOpen(false); }}
                  style={{
                    padding: "7px 4px", borderRadius: "7px",
                    backgroundColor: a ? "#059669" : "#fff",
                    border: `1.5px solid ${a ? "#059669" : "#e2e8f0"}`,
                    color: a ? "#fff" : "#475569",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >{c}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert card */}
      {schoolMissing && (
        <div style={{ padding: "6px 0 0" }}>
          <SchoolAlertCard onGo={() => navigate("/profil")} />
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    margin: "6px 4px 6px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Navigation
        </p>
        {MAIN_NAV.map(({ path, Icon, label }) => {
          const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
          const showDot = path === "/profil" && schoolMissing;
          return (
            <button key={path} onClick={() => navigate(path)}
              style={{ ...navItemStyle(active), position: "relative", marginBottom: "1px" }}>
              <Icon style={{ width: 15, height: 15, flexShrink: 0, strokeWidth: 1.75 }} />
              {label}
              {showDot && (
                <span style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  width: 6, height: 6, borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                }} />
              )}
            </button>
          );
        })}

        {/* Separator before logout */}
        <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "8px 4px" }} />
      </nav>

      {/* User card + logout */}
      <UserCard profile={profile} onLogout={onLogout} />
    </aside>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

function MobileTopBar({ activeClass, onMenuOpen }: {
  activeClass: string; onMenuOpen: () => void;
}) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: "48px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0",
      display: "flex", alignItems: "center", padding: "0 16px", gap: "12px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
        <div style={{
          width: 26, height: 26, borderRadius: "6px",
          background: "linear-gradient(135deg, #0d1f3c 0%, #3182ce 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GraduationCap style={{ width: 13, height: 13, color: "#fff" }} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a",
                       letterSpacing: "-0.01em" }}>
          École 2.0
        </span>
      </div>
      <span style={{
        fontSize: "11px", fontWeight: 700, color: "#059669",
        backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0",
        borderRadius: "6px", padding: "2px 10px",
      }}>
        {activeClass}
      </span>
      <button
        onClick={onMenuOpen}
        style={{
          width: 34, height: 34, borderRadius: "8px",
          backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        <Menu style={{ width: 16, height: 16, color: "#475569", strokeWidth: 1.75 }} />
      </button>
    </div>
  );
}

// ─── Mobile Bottom Nav (3 items) ──────────────────────────────────────────────

function MobileBottomNav() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      height: "64px", backgroundColor: "#fff", borderTop: "1px solid #e2e8f0",
      display: "flex", alignItems: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {BOTTOM_NAV.map(({ path, Icon, label }) => {
        const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
        return (
          <button key={path} onClick={() => navigate(path)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "3px", height: "100%", border: "none",
              backgroundColor: "transparent", cursor: "pointer",
              color: active ? "#059669" : "#94a3b8", position: "relative",
            }}
          >
            {active && (
              <span style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: 24, height: 2, borderRadius: "0 0 4px 4px",
                backgroundColor: "#059669",
              }} />
            )}
            <Icon style={{ width: 20, height: 20, strokeWidth: 1.75 }} />
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

function MobileDrawer({ open, onClose, profile, onLogout }: {
  open: boolean; onClose: () => void;
  profile: UserProfile | null; onLogout: () => void;
}) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { activeClass, setActiveClass, role, setRole } = useAppContext();
  const schoolMissing = !profile?.ecoleName?.trim();
  const initials   = getInitials(profile?.fullName || "E");
  const [logHover, setLogHover] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function goTo(path: string) { navigate(path); onClose(); }

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 300,
        backgroundColor: "rgba(15,23,42,0.45)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 240ms ease",
      }} />
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 400,
        backgroundColor: "#fff", borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.14)",
        transform: open ? "translateY(0)" : "translateY(105%)",
        transition: "transform 280ms cubic-bezier(0.32,0.72,0,1)",
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: "#e2e8f0" }} />
        </div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 20px 12px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 700, color: "#fff",
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                {profile?.fullName || "Enseignant"}
              </p>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                {profile?.role === "director" ? "Directeur" : "Enseignant"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "8px",
                     backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
                     display: "flex", alignItems: "center", justifyContent: "center",
                     cursor: "pointer" }}>
            <X style={{ width: 15, height: 15, color: "#475569", strokeWidth: 1.75 }} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>
          {/* Alert */}
          {schoolMissing && (
            <div style={{ marginBottom: "12px" }}>
              <SchoolAlertCard onGo={() => goTo("/profil")} />
            </div>
          )}

          {/* Nouvelle Fiche */}
          <button
            onClick={() => goTo("/new-fiche")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              width: "100%", padding: "12px", borderRadius: "12px", marginBottom: "14px",
              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(5,150,105,0.30)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Plus style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
            Nouvelle Fiche
          </button>

          {/* Class selector */}
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      margin: "0 4px 8px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Classe active
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "5px",
                        marginBottom: "14px" }}>
            {ALL_CLASSES.map(c => {
              const a = activeClass === c;
              return (
                <button key={c} onClick={() => setActiveClass(c)}
                  style={{
                    padding: "7px 4px", borderRadius: "7px",
                    backgroundColor: a ? "#059669" : "#f8fafc",
                    border: `1.5px solid ${a ? "#059669" : "#e2e8f0"}`,
                    color: a ? "#fff" : "#475569",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>{c}</button>
              );
            })}
          </div>

          {/* Nav */}
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      margin: "0 4px 8px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Navigation
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px",
                        marginBottom: "12px" }}>
            {MAIN_NAV.map(({ path, Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              const showDot = path === "/profil" && schoolMissing;
              return (
                <button key={path} onClick={() => goTo(path)}
                  style={{ ...navItemStyle(active), position: "relative" }}>
                  <Icon style={{ width: 15, height: 15, strokeWidth: 1.75, flexShrink: 0 }} />
                  {label}
                  {showDot && (
                    <span style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)",
                      width: 6, height: 6, borderRadius: "50%",
                      backgroundColor: "#f59e0b",
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Role toggle */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {(["teacher", "director"] as UserRole[]).map(r => {
              const a = role === r;
              return (
                <button key={r} onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: "9px 8px", borderRadius: "9px",
                    backgroundColor: a ? "#059669" : "#f8fafc",
                    border: `1.5px solid ${a ? "#059669" : "#e2e8f0"}`,
                    color: a ? "#fff" : "#64748b",
                    fontWeight: 600, fontSize: "12.5px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {a && <Check style={{ width: 12, height: 12 }} />}
                  {r === "teacher" ? "Enseignant" : "Directeur"}
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <button
            onMouseEnter={() => setLogHover(true)}
            onMouseLeave={() => setLogHover(false)}
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              width: "100%", padding: "10px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 500,
              color:           logHover ? "#ef4444" : "#94a3b8",
              backgroundColor: logHover ? "#fff1f2" : "transparent",
              border:          `1px solid ${logHover ? "#fecaca" : "#f1f5f9"}`,
              cursor: "pointer", transition: "all 160ms ease",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: "8px",
            }}
          >
            <LogOut style={{ width: 14, height: 14, strokeWidth: 1.75 }} />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const { activeClass }                         = useAppContext();
  const navigate                                = useNavigate();
  const { pathname }                            = useLocation();
  const [drawerOpen, setDrawerOpen]             = useState(false);

  // Auth guard
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", backgroundColor: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "12px", margin: "0 auto 12px",
            background: "linear-gradient(135deg, #0d1f3c 0%, #3182ce 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Chargement…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // Profile completion guard — exempt profil / parametres / abonnement
  if (
    profile !== null &&
    !profile?.ecoleName?.trim() &&
    !GUARD_EXEMPT.some(p => pathname.startsWith(p))
  ) {
    return <Navigate to="/profil" replace />;
  }

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden">
        <MobileTopBar activeClass={activeClass} onMenuOpen={() => setDrawerOpen(true)} />
      </div>

      {/* App shell */}
      <div className="md:flex" style={{ minHeight: "100vh" }}>
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <DesktopSidebar profile={profile} onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
          <div className="md:hidden"
               style={{ paddingTop: "48px", paddingBottom: "64px" }}>
            <Outlet />
          </div>
          <div className="hidden md:block">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        onLogout={handleLogout}
      />
    </>
  );
}
