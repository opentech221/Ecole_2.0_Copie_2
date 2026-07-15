import { BookOpenText } from "lucide-react";
import { ProgrammeNavigationWorkspace } from "@/modules/admin/components/ProgrammeNavigationWorkspace";

export function ProgrammePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.10),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-4 md:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpenText className="h-4 w-4 text-emerald-600" /> Programme officiel
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Module 6 · Navigation pédagogique</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue unifiée du référentiel officiel: niveau, domaine, sous-domaine, activité, objectifs et contenus.
          </p>
        </div>

        <ProgrammeNavigationWorkspace />
      </div>
    </div>
  );
}
