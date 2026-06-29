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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl flex flex-col">
        {/* Header - Subtle */}
        <div className="bg-[#1a365d] text-white p-4">
          <h1 className="text-xl text-white text-center">Génération Terminée</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Success Animation Area */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-[#10b981]/10 rounded-full animate-ping"></div>
            <div className="relative bg-gradient-to-br from-[#10b981] to-[#059669] rounded-full p-8 shadow-2xl">
              <CheckCircle2 className="w-20 h-20 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl text-[#2d3748] mb-2 text-center">
            Votre fiche est prête !
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-xs">
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
                  <h3 className="text-[#2d3748] font-medium mb-1 truncate">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {niveau.toUpperCase()} • {lesson.category}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
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
            <button className="w-full flex items-center justify-center gap-3 bg-[#1a365d] text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:bg-[#2d4a7c] transition-all transform hover:scale-105">
              <FileText className="w-5 h-5" />
              <span>Ouvrir le PDF</span>
            </button>

            {/* WhatsApp Share Button */}
            <button className="w-full flex items-center justify-center gap-3 bg-[#25d366] text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:bg-[#1fb854] transition-all transform hover:scale-105">
              <Share2 className="w-5 h-5" />
              <span>Partager sur WhatsApp</span>
            </button>

            {/* Back to Dashboard */}
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-[#2d3748] px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all"
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
