import { Building2, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router";

const ADMIN_NAV = [
  { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
  { to: "/admin/saas", label: "Administration SaaS", icon: Sparkles },
  { to: "/admin/legacy", label: "Interface héritée", icon: ShieldCheck },
] as const;

export function AdminModuleLayout() {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,rgba(247,250,255,0.96),rgba(239,244,255,0.96))] p-3 md:p-4 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))]">
      <div className="mx-auto max-w-7xl space-y-4">
        <aside className="rounded-3xl border border-slate-300/80 bg-white/95 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/90">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-300/80 bg-slate-100/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/90">
            <Building2 className="h-5 w-5 text-slate-800 dark:text-slate-100" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Module d'administration</p>
              <p className="text-xs text-slate-700 dark:text-slate-300">Pilotage, sécurité, conformité</p>
            </div>
          </div>

          <nav className="w-full overflow-x-auto" aria-label="Navigation administration">
            <div className="flex min-w-max gap-2 rounded-2xl border border-slate-300/80 bg-slate-50/90 p-1.5 dark:border-slate-700/80 dark:bg-slate-900/80">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </aside>

        <section className="min-w-0 rounded-3xl border border-slate-300/80 bg-white/95 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/90">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
