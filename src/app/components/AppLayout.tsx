import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import {
  Home, Users, FileText, Compass, BookMarked, UserCircle,
  LogOut, GraduationCap, Menu, X, AlertTriangle, ChevronRight,
  Calendar, Check, Plus,
} from "lucide-react";
import { useAppContext, ALL_CLASSES, UserRole } from "../contexts/AppContext";
import { useAuthContext }                        from "../contexts/AuthContext";
import { signOut }                               from "../../hooks/useAuth";
import type { UserProfile }                      from "../../hooks/useAuth";

// ─── Utilities ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

const MAIN_NAV = [
  { path: "/",          Icon: Home,       label: "Tableau de bord"    },
  { path: "/eleves",    Icon: Users,      label: "Gestion des Élèves" },
  { path: "/documents", Icon: FileText,   label: "Documents"          },
  { path: "/planning",  Icon: Compass,    label: "Orientation"        },
  { path: "/cahier",    Icon: BookMarked, label: "Cahier Journal"     },
];

// 3 items shown in mobile bottom nav + menu button
const BOTTOM_NAV = [
  { path: "/",          Icon: Home,     label: "Accueil"   },
  { path: "/eleves",    Icon: Users,    label: "Élèves"    },
  { path: "/documents", Icon: FileText, label: "Documents" },
];

// ─── Shared active-link style helper ─────────────────────────────────────────

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    display:         "flex",
    alignItems:      "center",
    gap:             "10px",
    width:           "100%",
    padding:         "9px 12px 9px 14px",
    borderRadius:    "10px",
    fontSize:        "13.5px",
    fontWeight:      active ? 600 : 400,
    color:           active ? "#059669" : "#475569",
    backgroundColor: active ? "#ecfdf5" : "transparent",
    boxShadow:       active ? "inset 3px 0 0 #059669" : "inset 3px 0 0 transparent",
    cursor:          "pointer",
    border:          "none",
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    transition:      "background-color 140ms, color 140ms",
    textAlign:       "left",
  };
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function SchoolAlertCard({ onGoToProfile }: { onGoToProfile: () => void }) {
  return (
    <div style={{
      margin:          "0 12px 4px",
      padding:         "12px 14px",
      borderRadius:    "12px",
      backgroundColor: "#fffbeb",
      border:          "1px solid #fde68a",
    }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <AlertTriangle style={{ width: 14, height: 14, color: "#d97706",
                                flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#92400e",
                      margin: "0 0 4px", lineHeight: 1.4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Données école manquantes
          </p>
          <p style={{ fontSize: "11px", color: "#b45309", margin: "0 0 8px",
                      lineHeight: 1.45, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Configurez votre école pour générer vos fiches.
          </p>
          <button
            onClick={onGoToProfile}
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "4px",
              fontSize:        "11px",
              fontWeight:      700,
              color:           "#92400e",
              backgroundColor: "#fef3c7",
              border:          "1px solid #fcd34d",
              borderRadius:    "6px",
              padding:         "3px 10px",
              cursor:          "pointer",
              fontFamily:      "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Aller au profil <ChevronRight style={{ width: 11, height: 11 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User profile card (bottom of sidebar) ───────────────────────────────────

function UserCard({ profile, onLogout }: { profile: UserProfile | null; onLogout: () => void }) {
  const [hover, setHover] = useState(false);

  const displayName = profile?.fullName || "Cheikh Tidiane Samba Ba";
  const displayRole = profile?.role === "director" ? "Directeur" : "Enseignant";
  const initials    = getInitials(displayName);

  return (
    <div style={{
      borderTop: "1px solid #f1f5f9",
      padding:   "12px",
    }}>
      {/* User info row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 10px 8px", marginBottom: "6px" }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background:    "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
          display:       "flex", alignItems: "center", justifyContent: "center",
          fontSize:      "12px", fontWeight: 700, color: "#fff",
          fontFamily:    "'Plus Jakarta Sans', sans-serif",
          letterSpacing: "0.04em",
        }}>
          {initials}
        </div>
        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b",
                      margin: 0, whiteSpace: "nowrap", overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {displayName}
          </p>
          <p style={{ fontSize: "11px", color: "#64748b", margin: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {displayRole}
          </p>
        </div>
      </div>

      {/* Logout — ghost, red on hover */}
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onLogout}
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "6px",
          width:           "100%",
          padding:         "8px 12px",
          borderRadius:    "8px",
          fontSize:        "12.5px",
          fontWeight:      500,
          color:           hover ? "#ef4444" : "#94a3b8",
          backgroundColor: hover ? "#fff1f2" : "transparent",
          border:          `1px solid ${hover ? "#fecaca" : "#f1f5f9"}`,
          cursor:          "pointer",
          fontFamily:      "'Plus Jakarta Sans', sans-serif",
          transition:      "all 160ms ease",
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
  profile:  UserProfile | null;
  onLogout: () => void;
}) {
  const navigate      = useNavigate();
  const { pathname }  = useLocation();
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
      width:           "260px",
      minWidth:        "260px",
      backgroundColor: "#ffffff",
      borderRight:     "1px solid #e2e8f0",
      display:         "flex",
      flexDirection:   "column",
      height:          "100vh",
      position:        "sticky",
      top:             0,
      overflowY:       "auto",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding:      "20px 16px 16px",
        borderBottom: "1px solid #f1f5f9",
        display:      "flex",
        alignItems:   "center",
        gap:          "10px",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "8px",
          background: "linear-gradient(135deg, #0d1f3c 0%, #3182ce 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <GraduationCap style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a",
                      margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif",
                      letterSpacing: "-0.01em" }}>
            École 2.0
          </p>
          <p style={{ fontSize: "10.5px", color: "#94a3b8", margin: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {profile?.ecoleName || "Plateforme scolaire"}
          </p>
        </div>
      </div>

      {/* ── Class selector pill ── */}
      <div style={{ padding: "10px 12px 4px" }} ref={classRef}>
        <button
          onClick={() => setClassOpen(o => !o)}
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
            width:           "100%",
            padding:         "7px 12px",
            borderRadius:    "8px",
            backgroundColor: "#f8fafc",
            border:          "1px solid #e2e8f0",
            cursor:          "pointer",
            fontFamily:      "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
            Classe active :
          </span>
          <span style={{
            fontSize: "12px", fontWeight: 800, color: "#059669",
            backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0",
            borderRadius: "6px", padding: "1px 8px",
          }}>
            {activeClass}
          </span>
        </button>

        {classOpen && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px",
            marginTop: "8px", padding: "10px",
            backgroundColor: "#f8fafc", borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}>
            {ALL_CLASSES.map(c => {
              const active = activeClass === c;
              return (
                <button
                  key={c}
                  onClick={() => { setActiveClass(c); setClassOpen(false); }}
                  style={{
                    padding:         "8px 4px",
                    borderRadius:    "8px",
                    backgroundColor: active ? "#059669" : "#fff",
                    border:          `1.5px solid ${active ? "#059669" : "#e2e8f0"}`,
                    color:           active ? "#fff" : "#475569",
                    fontSize:        "13px",
                    fontWeight:      700,
                    cursor:          "pointer",
                    fontFamily:      "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Alert card (conditional) ── */}
      {schoolMissing && (
        <div style={{ padding: "8px 12px 0" }}>
          <SchoolAlertCard onGoToProfile={() => navigate("/profil")} />
        </div>
      )}

      {/* ── Main nav ── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    margin: "8px 4px 6px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Navigation
        </p>

        {MAIN_NAV.map(({ path, Icon, label }) => {
          const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={navItemStyle(active)}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0, strokeWidth: 1.75 }} />
              {label}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "10px 4px 8px" }} />

        <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    margin: "0 4px 6px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Compte
        </p>

        {/* Mon Profil — active state + alert dot */}
        {(() => {
          const active = pathname.startsWith("/profil");
          return (
            <button
              onClick={() => navigate("/profil")}
              style={{ ...navItemStyle(active), position: "relative" }}
            >
              <UserCircle style={{ width: 16, height: 16, flexShrink: 0, strokeWidth: 1.75 }} />
              Mon Profil
              {schoolMissing && (
                <span style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  width: 7, height: 7, borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                }} />
              )}
            </button>
          );
        })()}
      </nav>

      {/* ── Nouvelle Fiche CTA ── */}
      <div style={{ padding: "0 12px 8px" }}>
        <button
          onClick={() => navigate("/new-fiche")}
          style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             "8px",
            width:           "100%",
            padding:         "11px 16px",
            borderRadius:    "10px",
            background:      "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            color:           "#fff",
            fontWeight:      700,
            fontSize:        "13px",
            border:          "none",
            cursor:          "pointer",
            boxShadow:       "0 3px 12px rgba(5,150,105,0.30)",
            fontFamily:      "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Plus style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
          Nouvelle Fiche
        </button>
      </div>

      {/* ── User card + logout ── */}
      <UserCard profile={profile} onLogout={onLogout} />
    </aside>
  );
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

function MobileTopBar({ schoolName, activeClass, onMenuOpen }: {
  schoolName:  string;
  activeClass: string;
  onMenuOpen:  () => void;
}) {
  return (
    <div style={{
      position:        "fixed",
      top:             0, left: 0, right: 0,
      zIndex:          200,
      height:          "48px",
      backgroundColor: "#ffffff",
      borderBottom:    "1px solid #e2e8f0",
      display:         "flex",
      alignItems:      "center",
      padding:         "0 16px",
      gap:             "12px",
      fontFamily:      "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Logo */}
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

      {/* Class pill */}
      <span style={{
        fontSize: "11px", fontWeight: 700, color: "#059669",
        backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0",
        borderRadius: "6px", padding: "2px 10px",
      }}>
        {activeClass}
      </span>

      {/* Menu button */}
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

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────

function MobileBottomNav() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{
      position:        "fixed",
      bottom:          0, left: 0, right: 0,
      zIndex:          200,
      height:          "64px",
      backgroundColor: "#ffffff",
      borderTop:       "1px solid #e2e8f0",
      display:         "flex",
      alignItems:      "center",
      fontFamily:      "'Plus Jakarta Sans', sans-serif",
    }}>
      {BOTTOM_NAV.map(({ path, Icon, label }) => {
        const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex:            1,
              display:         "flex",
              flexDirection:   "column",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "3px",
              height:          "100%",
              border:          "none",
              backgroundColor: "transparent",
              cursor:          "pointer",
              color:           active ? "#059669" : "#94a3b8",
              position:        "relative",
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

// ─── Mobile Drawer (Bottom Sheet) ────────────────────────────────────────────

function MobileDrawer({ open, onClose, profile, onLogout }: {
  open:     boolean;
  onClose:  () => void;
  profile:  UserProfile | null;
  onLogout: () => void;
}) {
  const navigate      = useNavigate();
  const { pathname }  = useLocation();
  const { activeClass, setActiveClass, role, setRole } = useAppContext();
  const schoolMissing = !profile?.ecoleName?.trim();
  const initials      = getInitials(profile?.fullName || "Cheikh Tidiane Samba Ba");
  const displayName   = profile?.fullName || "Cheikh Tidiane Samba Ba";
  const displayRole   = profile?.role === "director" ? "Directeur" : "Enseignant";
  const [logoutHover, setLogoutHover] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function goTo(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          300,
          backgroundColor: "rgba(15,23,42,0.45)",
          opacity:         open ? 1 : 0,
          pointerEvents:   open ? "auto" : "none",
          transition:      "opacity 240ms ease",
          backdropFilter:  "blur(2px)",
        }}
      />

      {/* Sheet */}
      <div style={{
        position:        "fixed",
        left:            0, right: 0, bottom: 0,
        zIndex:          400,
        backgroundColor: "#ffffff",
        borderRadius:    "20px 20px 0 0",
        boxShadow:       "0 -8px 40px rgba(0,0,0,0.14)",
        transform:       open ? "translateY(0)" : "translateY(105%)",
        transition:      "transform 280ms cubic-bezier(0.32,0.72,0,1)",
        maxHeight:       "88vh",
        display:         "flex",
        flexDirection:   "column",
        fontFamily:      "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Handle + close */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: "#e2e8f0" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "4px 20px 12px", borderBottom: "1px solid #f1f5f9" }}>
          {/* User summary */}
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
                {displayName}
              </p>
              <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{displayRole}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "8px",
                     backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
                     display: "flex", alignItems: "center", justifyContent: "center",
                     cursor: "pointer" }}
          >
            <X style={{ width: 15, height: 15, color: "#475569", strokeWidth: 1.75 }} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>

          {/* Alert card */}
          {schoolMissing && (
            <div style={{ marginBottom: "12px" }}>
              <SchoolAlertCard onGoToProfile={() => goTo("/profil")} />
            </div>
          )}

          {/* Class selector */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        margin: "0 0 8px 4px" }}>
              Classe active
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px" }}>
              {ALL_CLASSES.map(c => {
                const active = activeClass === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveClass(c)}
                    style={{
                      padding:         "8px 4px",
                      borderRadius:    "8px",
                      backgroundColor: active ? "#059669" : "#f8fafc",
                      border:          `1.5px solid ${active ? "#059669" : "#e2e8f0"}`,
                      color:           active ? "#fff" : "#475569",
                      fontSize:        "12px", fontWeight: 700,
                      cursor:          "pointer",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav links */}
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      margin: "0 4px 8px" }}>
            Navigation
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "12px" }}>
            {MAIN_NAV.map(({ path, Icon, label }) => {
              const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
              return (
                <button key={path} onClick={() => goTo(path)} style={navItemStyle(active)}>
                  <Icon style={{ width: 16, height: 16, strokeWidth: 1.75, flexShrink: 0 }} />
                  {label}
                </button>
              );
            })}

            <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 4px" }} />

            {/* Profil */}
            {(() => {
              const active = pathname.startsWith("/profil");
              return (
                <button onClick={() => goTo("/profil")}
                  style={{ ...navItemStyle(active), position: "relative" }}>
                  <UserCircle style={{ width: 16, height: 16, strokeWidth: 1.75, flexShrink: 0 }} />
                  Mon Profil
                  {schoolMissing && (
                    <span style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)",
                      width: 7, height: 7, borderRadius: "50%",
                      backgroundColor: "#f59e0b",
                    }} />
                  )}
                </button>
              );
            })()}
          </div>

          {/* Role toggle */}
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      margin: "0 4px 8px" }}>
            Mode d'accès
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {(["teacher", "director"] as UserRole[]).map(r => {
              const active = role === r;
              return (
                <button
                  key={r} onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: "10px",
                    backgroundColor: active ? "#059669" : "#f8fafc",
                    border: `1.5px solid ${active ? "#059669" : "#e2e8f0"}`,
                    color: active ? "#fff" : "#64748b",
                    fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {active && <Check style={{ width: 13, height: 13 }} />}
                  {r === "teacher" ? "Enseignant" : "Directeur"}
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <button
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            onClick={onLogout}
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "6px",
              width:           "100%",
              padding:         "11px",
              borderRadius:    "10px",
              fontSize:        "13px", fontWeight: 500,
              color:           logoutHover ? "#ef4444" : "#94a3b8",
              backgroundColor: logoutHover ? "#fff1f2" : "transparent",
              border:          `1px solid ${logoutHover ? "#fecaca" : "#f1f5f9"}`,
              cursor:          "pointer",
              fontFamily:      "'Plus Jakarta Sans', sans-serif",
              transition:      "all 160ms ease",
              marginBottom:    "8px",
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
  const { activeClass, schoolName }             = useAppContext();
  const navigate                                = useNavigate();
  const { pathname }                            = useLocation();
  const [drawerOpen, setDrawerOpen]             = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", backgroundColor: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "12px", margin: "0 auto 14px",
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

  // ── Profile completion guard ───────────────────────────────────────────────
  if (profile !== null && !profile?.ecoleName?.trim() && pathname !== "/profil") {
    return <Navigate to="/profil" replace />;
  }

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* ── Mobile top bar (< md) ── */}
      <div className="md:hidden">
        <MobileTopBar
          schoolName={schoolName}
          activeClass={activeClass}
          onMenuOpen={() => setDrawerOpen(true)}
        />
      </div>

      {/* ── App shell ── */}
      <div
        className="md:flex"
        style={{ minHeight: "100vh" }}
      >
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <DesktopSidebar profile={profile} onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <div
          className="flex-1 min-w-0"
          style={{
            minWidth:     0,
            paddingTop:   undefined, // handled by className below
            paddingBottom: undefined,
          }}
        >
          {/* Mobile: offset for top bar + bottom nav */}
          <div className="md:hidden" style={{ paddingTop: "48px", paddingBottom: "64px" }}>
            <Outlet />
          </div>
          {/* Desktop: no offset needed */}
          <div className="hidden md:block">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav (< md) ── */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>

      {/* ── Mobile drawer ── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        onLogout={handleLogout}
      />
    </>
  );
}
