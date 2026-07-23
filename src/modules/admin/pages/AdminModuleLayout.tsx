import { Building2, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router";

const ADMIN_NAV = [
  { to: "/admin", label: "Console", icon: LayoutDashboard, end: true },
  { to: "/admin/saas", label: "SaaS", icon: Sparkles },
  { to: "/admin/legacy", label: "Legacy", icon: ShieldCheck },
] as const;

export function AdminModuleLayout() {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,rgba(247,250,255,0.96),rgba(239,244,255,0.96))] p-3 md:p-4 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))]">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-300/80 bg-white/95 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/90">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-300/80 bg-slate-100/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/90">
            <Building2 className="h-5 w-5 text-slate-800 dark:text-slate-100" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Module Administration</p>
              <p className="text-xs text-slate-700 dark:text-slate-300">Pilotage, sécurité, conformité</p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Navigation administration">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 rounded-3xl border border-slate-300/80 bg-white/95 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/90">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
