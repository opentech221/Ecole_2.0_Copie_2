import { useNavigate, useLocation } from "react-router";
import { CheckCircle2, FileText, Share2, Home } from "lucide-react";

export function SuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { niveau, domaine, lesson } = location.state || {};

  if (!lesson) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-card min-h-screen shadow-xl flex flex-col">
        {/* Header - Subtle */}
        <div className="bg-primary text-white p-4">
          <h1 className="text-xl text-white text-center">Génération Terminée</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Success Animation Area */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-secondary/10 rounded-full animate-ping"></div>
            <div className="relative bg-gradient-to-br from-secondary to-primary rounded-full p-8 shadow-2xl">
              <CheckCircle2 className="w-20 h-20 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl text-foreground mb-2 text-center">
            Votre fiche est prête !
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-center mb-8 max-w-xs">
            La fiche pédagogique a été générée avec succès et est prête à être
            utilisée.
          </p>

          {/* PDF Preview Card */}
          <div className="w-full max-w-sm mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-medium mb-1 truncate">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    {niveau.toUpperCase()} • {lesson.category}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span>Format PDF</span>
                    <span>•</span>
                    <span>Prêt à l'emploi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-3">
            {/* Open PDF Button */}
            <button className="w-full flex items-center justify-center gap-3 bg-primary text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:bg-secondary transition-all transform hover:scale-105">
              <FileText className="w-5 h-5" />
              <span>Ouvrir le PDF</span>
            </button>

            {/* WhatsApp Share Button */}
            <button className="w-full flex items-center justify-center gap-3 bg-secondary text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:bg-primary transition-all transform hover:scale-105">
              <Share2 className="w-5 h-5" />
              <span>Partager sur WhatsApp</span>
            </button>

            {/* Back to Dashboard */}
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-3 bg-card border-2 border-border text-foreground px-6 py-3 rounded-xl font-medium hover:bg-muted transition-all"
            >
              <Home className="w-5 h-5" />
              <span>Retour au tableau de bord</span>
            </button>
          </div>
        </div>

        {/* Bottom Tip */}
        <div className="p-6 bg-blue-50 border-t border-blue-100">
          <div className="max-w-sm mx-auto">
            <p className="text-sm text-[#3182ce] text-center">
              💡 <span className="font-medium">Astuce :</span> Partagez vos fiches
              avec vos collègues pour favoriser la collaboration pédagogique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
