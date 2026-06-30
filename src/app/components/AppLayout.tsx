import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import {
  ChevronDown, GraduationCap, X, Check, AlertTriangle,
  Home, Calendar, Users, BookMarked, FileText, Plus,
  UserCircle, LogOut,
} from "lucide-react";
import { useAppContext, ALL_CLASSES, UserRole } from "../contexts/AppContext";
import { useAuthContext }                        from "../contexts/AuthContext";
import { signOut }                               from "../../hooks/useAuth";
import type { UserProfile }                      from "../../hooks/useAuth";

// ─── Navigation items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: "/",          Icon: Home,        label: "Accueil"        },
  { path: "/planning",  Icon: Calendar,    label: "Planification"  },
  { path: "/eleves",    Icon: Users,       label: "Élèves & Notes" },
  { path: "/cahier",    Icon: BookMarked,  label: "Cahier Journal" },
  { path: "/documents", Icon: FileText,    label: "Documents"      },
];

// ─── Desktop Left Sidebar ─────────────────────────────────────────────────────

function DesktopSidebar({ profile }: { profile: UserProfile | null }) {
  const navigate          = useNavigate();
  const { pathname }      = useLocation();
  const [logoutHover, setLogoutHover] = useState(false);

  const schoolMissing = !profile?.ecoleName?.trim();

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0"
      style={{
        width:           "220px",
        backgroundColor: "#0d1f3c",
        borderRight:     "1px solid rgba(255,255,255,0.06)",
        position:        "sticky",
        top:             "36px",
        height:          "calc(100vh - 36px)",
        overflowY:       "auto",
        alignSelf:       "flex-start",
        flexShrink:      0,
      }}
    >
      {/* Sub-branding */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase", letterSpacing: "0.10em", margin: 0 }}>
          Plateforme Scolaire
        </p>
        <p style={{ fontSize: "11px", fontWeight: 600,
                    color: profile?.ecoleName ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)",
                    marginTop: "2px", marginBottom: 0, fontStyle: profile?.ecoleName ? "normal" : "italic" }}>
          {profile?.ecoleName || "École non configurée"}
        </p>
      </div>

      {/* ── Conditional warning banner ── */}
      {schoolMissing && (
        <button
          onClick={() => navigate("/profil")}
          style={{
            margin:          "10px 10px 0",
            padding:         "10px 12px",
            borderRadius:    "10px",
            backgroundColor: "rgba(251,191,36,0.12)",
            border:          "1px solid rgba(251,191,36,0.30)",
            display:         "flex",
            alignItems:      "flex-start",
            gap:             "8px",
            cursor:          "pointer",
            textAlign:       "left",
            width:           "calc(100% - 20px)",
          }}
        >
          <AlertTriangle style={{ width: 13, height: 13, color: "#fbbf24",
                                   flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontSize: "11px", lineHeight: 1.45, color: "#fcd34d", fontWeight: 500,
                         fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Configurez votre école pour activer les documents.
          </span>
        </button>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {NAV_ITEMS.map(({ path, Icon, label }) => {
          const active = path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-3 rounded-xl transition-all text-left mb-0.5 border-0"
              style={{
                padding:         "9px 12px",
                fontSize:        "13px",
                fontWeight:      active ? 700 : 500,
                backgroundColor: active ? "rgba(49,130,206,0.18)" : "transparent",
                color:           active ? "#93c5fd" : "rgba(255,255,255,0.45)",
                boxShadow:       active ? "inset 3px 0 0 #3182ce" : "none",
                cursor:          "pointer",
                fontFamily:      "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {label}
            </button>
          );
        })}

        {/* Divider before profile */}
        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)",
                      margin: "8px 4px" }} />

        {/* Mon Profil — separate so it always renders below the divider */}
        {(() => {
          const active = pathname.startsWith("/profil");
          return (
            <button
              onClick={() => navigate("/profil")}
              className="w-full flex items-center gap-3 rounded-xl transition-all text-left mb-0.5 border-0"
              style={{
                padding:         "9px 12px",
                fontSize:        "13px",
                fontWeight:      active ? 700 : 500,
                backgroundColor: active ? "rgba(49,130,206,0.18)" : "transparent",
                color:           active ? "#93c5fd" : "rgba(255,255,255,0.45)",
                boxShadow:       active ? "inset 3px 0 0 #3182ce" : "none",
                cursor:          "pointer",
                fontFamily:      "'Plus Jakarta Sans', sans-serif",
                position:        "relative",
              }}
            >
              <UserCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              Mon Profil
              {/* Red dot if school missing */}
              {schoolMissing && (
                <span style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  width: 6, height: 6, borderRadius: "50%",
                  backgroundColor: "#f87171",
                }} />
              )}
            </button>
          );
        })()}
      </nav>

      {/* Bottom: Nouvelle Fiche CTA + Logout */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => navigate("/new-fiche")}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold transition-all active:scale-[0.98]"
          style={{
            minHeight:    "44px",
            fontSize:     "13px",
            background:   "linear-gradient(135deg, #1a365d 0%, #3182ce 100%)",
            color:        "#fff",
            boxShadow:    "0 4px 14px rgba(49,130,206,0.35)",
            cursor:       "pointer",
            border:       "none",
            fontFamily:   "'Plus Jakarta Sans', sans-serif",
            marginBottom: "8px",
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Nouvelle Fiche
        </button>

        {/* Logout — red/pink on hover */}
        <button
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl transition-all active:scale-95"
          style={{
            minHeight:       "36px",
            fontSize:        "12px",
            fontWeight:      600,
            backgroundColor: logoutHover ? "rgba(239,68,68,0.12)" : "transparent",
            color:           logoutHover ? "#fca5a5" : "rgba(255,255,255,0.35)",
            border:          `1px solid ${logoutHover ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.10)"}`,
            cursor:          "pointer",
            fontFamily:      "'Plus Jakarta Sans', sans-serif",
            transition:      "all 180ms ease",
          }}
        >
          <LogOut style={{ width: 13, height: 13 }} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ─── Class Bottom Sheet (mobile) ──────────────────────────────────────────────

function ClassBottomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activeClass, setActiveClass, role, setRole } = useAppContext();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        className="fixed inset-0 z-[350] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity:       open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-[400] bg-white"
        style={{
          borderRadius:  "24px 24px 0 0",
          transform:     open ? "translateY(0)" : "translateY(110%)",
          transition:    "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
          maxHeight:     "78vh",
          boxShadow:     "0 -4px 40px rgba(0,0,0,0.22)",
          fontFamily:    "'Plus Jakarta Sans', sans-serif",
          overflow:      "hidden",
          display:       "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "#e2e8f0" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "4px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <p style={{ fontSize: "17px", fontWeight: 800, color: "#1a365d",
                        lineHeight: 1.2, margin: 0 }}>
              Classe active
            </p>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", marginBottom: 0 }}>
              Sélectionnez pour filtrer toutes les données
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#f1f5f9",
                     display: "flex", alignItems: "center", justifyContent: "center",
                     border: "none", cursor: "pointer" }}
          >
            <X style={{ width: 16, height: 16, color: "#475569" }} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 0" }}>
          <p style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "10px" }}>
            Niveaux scolaires
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px",
                        marginBottom: "20px" }}>
            {ALL_CLASSES.map(c => {
              const active = activeClass === c;
              return (
                <button
                  key={c}
                  onClick={() => { setActiveClass(c); onClose(); }}
                  className="transition-all active:scale-95"
                  style={{
                    padding:         "18px 8px 12px",
                    borderRadius:    "16px",
                    backgroundColor: active ? "#1a365d" : "#f8fafc",
                    border:          `2px solid ${active ? "#1a365d" : "#e2e8f0"}`,
                    color:           active ? "#fff" : "#475569",
                    fontWeight:      800, fontSize: "18px",
                    display:         "flex", flexDirection: "column",
                    alignItems:      "center", gap: "3px",
                    boxShadow:       active ? "0 4px 16px rgba(26,54,93,0.28)" : "none",
                    cursor:          "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {c}
                  {active && (
                    <span style={{ fontSize: "8.5px", color: "#93c5fd", fontWeight: 600 }}>
                      ✓ Actif
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "10px" }}>
            Mode d'accès
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            {(["teacher", "director"] as UserRole[]).map(r => {
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-95"
                  style={{
                    padding:         "13px 16px",
                    backgroundColor: active ? "#1a365d" : "#f8fafc",
                    border:          `2px solid ${active ? "#1a365d" : "#e2e8f0"}`,
                    color:           active ? "#fff" : "#475569",
                    fontWeight:      700, fontSize: "13px",
                    boxShadow:       active ? "0 4px 14px rgba(26,54,93,0.25)" : "none",
                    cursor:          "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {active && <Check style={{ width: 14, height: 14 }} />}
                  {r === "teacher" ? "Enseignant" : "Directeur"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Desktop class dropdown ───────────────────────────────────────────────────

function ClassDropdown({ onClose }: { onClose: () => void }) {
  const { activeClass, setActiveClass, role, setRole } = useAppContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[400]"
      style={{
        width: "270px", backgroundColor: "#fff", borderRadius: "14px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0", fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "10px 14px 8px", backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ fontSize: "10px", fontWeight: 800, color: "#1a365d",
                    textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Filtrer par classe
        </p>
      </div>
      <div style={{ padding: "10px", display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
        {ALL_CLASSES.map(c => {
          const active = activeClass === c;
          return (
            <button key={c}
              onClick={() => { setActiveClass(c); onClose(); }}
              className="rounded-xl font-bold transition-all active:scale-95"
              style={{
                padding:         "9px 4px",
                backgroundColor: active ? "#1a365d" : "#f1f5f9",
                color:           active ? "#fff" : "#475569",
                fontSize:        "13px", border: "none", cursor: "pointer",
                boxShadow:       active ? "0 2px 8px rgba(26,54,93,0.22)" : "none",
                fontFamily:      "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "0 10px 10px" }}>
        <div style={{ height: 1, backgroundColor: "#f1f5f9", margin: "2px 0 8px" }} />
        <div style={{ display: "flex", gap: "6px" }}>
          {(["teacher", "director"] as UserRole[]).map(r => {
            const active = role === r;
            return (
              <button key={r}
                onClick={() => setRole(r)}
                className="flex-1 rounded-xl font-semibold transition-all"
                style={{
                  padding:         "8px",
                  backgroundColor: active ? "#1a365d" : "#f8fafc",
                  color:           active ? "#fff" : "#94a3b8",
                  fontSize:        "11px",
                  border:          `1.5px solid ${active ? "#1a365d" : "#e2e8f0"}`,
                  cursor:          "pointer",
                  fontFamily:      "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {r === "teacher" ? "Prof." : "Dir."}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const { activeClass, schoolName, role }        = useAppContext();
  const navigate                                 = useNavigate();
  const { pathname }                             = useLocation();
  const [sheetOpen,    setSheetOpen]             = useState(false);
  const [dropdownOpen, setDropdownOpen]          = useState(false);
  const [topbarLogoutHover, setTopbarLogoutHover] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", backgroundColor: "#f4f6f9",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <GraduationCap style={{ width: 32, height: 32, color: "#3182ce",
                                   margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: "13px", color: "#64748b" }}>Chargement…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // ── Profile completion guard — redirect to /profil if ecole_nom missing ──
  if (!authLoading && profile !== null && !profile?.ecoleName?.trim() && pathname !== "/profil") {
    return <Navigate to="/profil" replace />;
  }

  const shortSchool = schoolName.split(" ").slice(0, 3).join(" ") || schoolName;

  return (
    <>
      {/* ══ FIXED TOP BAR ═══════════════════════════════════════════════════ */}
      <div
        className="fixed top-0 left-0 right-0 z-[200] flex items-center"
        style={{
          height:          "36px",
          backgroundColor: "#0d1f3c",
          borderBottom:    "1px solid rgba(255,255,255,0.07)",
          fontFamily:      "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Branding */}
        <div
          className="flex items-center gap-1.5 shrink-0 h-full border-r"
          style={{ padding: "0 14px", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <GraduationCap style={{ width: 13, height: 13, color: "#3182ce" }} />
          <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff",
                         letterSpacing: "0.12em", textTransform: "uppercase" }}>
            École 2.0
          </span>
        </div>

        {/* Context pill */}
        <div className="flex-1 flex items-center justify-center h-full">
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setSheetOpen(true);
                } else {
                  setDropdownOpen(o => !o);
                }
              }}
              className="flex items-center gap-2 rounded-full transition-all active:scale-[0.97]"
              style={{
                padding:         "3px 10px 3px 8px",
                backgroundColor: "rgba(255,255,255,0.07)",
                border:          "1px solid rgba(255,255,255,0.13)",
                cursor:          "pointer",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%",
                             backgroundColor: "#10b981", flexShrink: 0,
                             display: "inline-block" }} />
              <span style={{ fontSize: "10px", fontWeight: 700,
                             color: "rgba(255,255,255,0.8)" }}>
                {shortSchool}
              </span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>|</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#60a5fa" }}>
                {activeClass}
              </span>
              <ChevronDown style={{ width: 10, height: 10, color: "rgba(255,255,255,0.4)" }} />
            </button>
            {dropdownOpen && <ClassDropdown onClose={() => setDropdownOpen(false)} />}
          </div>
        </div>

        {/* Right controls: role badge + profil + logout */}
        <div
          className="flex items-center shrink-0 h-full gap-1 border-l"
          style={{ padding: "0 10px", borderColor: "rgba(255,255,255,0.07)" }}
        >
          {/* Role badge */}
          <span className="hidden sm:inline-flex" style={{
            fontSize:        "7.5px", fontWeight: 800,
            padding:         "2px 8px", borderRadius: "999px",
            letterSpacing:   "0.07em", textTransform: "uppercase",
            backgroundColor: role === "director"
              ? "rgba(59,130,246,0.18)" : "rgba(16,185,129,0.15)",
            color:  role === "director" ? "#93c5fd" : "#6ee7b7",
            border: `1px solid ${role === "director"
              ? "rgba(59,130,246,0.28)" : "rgba(16,185,129,0.22)"}`,
            marginRight: "4px",
          }}>
            {role === "director" ? "Directeur" : "Enseignant"}
          </span>

          {/* Profil icon button */}
          <button
            onClick={() => navigate("/profil")}
            title="Mon profil"
            style={{
              width: 28, height: 28, borderRadius: "8px",
              backgroundColor: pathname.startsWith("/profil")
                ? "rgba(49,130,206,0.25)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${pathname.startsWith("/profil")
                ? "rgba(49,130,206,0.50)" : "rgba(255,255,255,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <UserCircle style={{
              width: 14, height: 14,
              color: pathname.startsWith("/profil") ? "#93c5fd" : "rgba(255,255,255,0.6)",
            }} />
          </button>

          {/* Logout icon button — red on hover */}
          <button
            onMouseEnter={() => setTopbarLogoutHover(true)}
            onMouseLeave={() => setTopbarLogoutHover(false)}
            onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
            title="Déconnexion"
            style={{
              width: 28, height: 28, borderRadius: "8px",
              backgroundColor: topbarLogoutHover
                ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${topbarLogoutHover
                ? "rgba(239,68,68,0.40)" : "rgba(255,255,255,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "all 180ms ease",
            }}
          >
            <LogOut style={{
              width: 13, height: 13,
              color: topbarLogoutHover ? "#fca5a5" : "rgba(255,255,255,0.5)",
              transition: "color 180ms ease",
            }} />
          </button>
        </div>
      </div>

      {/* ══ APP SHELL ════════════════════════════════════════════════════════ */}
      <div
        className="lg:bg-[#cdd4de]"
        style={{ minHeight: "100vh", paddingTop: "36px" }}
      >
        <div
          className="lg:max-w-[1280px] lg:mx-auto lg:shadow-2xl"
          style={{ minHeight: "calc(100vh - 36px)", backgroundColor: "#f4f6f9" }}
        >
          <div className="flex" style={{ minHeight: "calc(100vh - 36px)" }}>
            <DesktopSidebar profile={profile} />
            <div className="flex-1 min-w-0" style={{ minWidth: 0 }}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM SHEET ══════════════════════════════════════════════ */}
      <ClassBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
