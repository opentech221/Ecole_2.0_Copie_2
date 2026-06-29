import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ChevronLeft, Search, BookOpen, CheckCircle2 } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  category: string;
}

const lessonsCatalog: Record<string, Lesson[]> = {
  grammaire: [
    { id: "1", title: "L'adjectif qualificatif", category: "Classes de mots" },
    {
      id: "2",
      title: "Le Complément d'Objet Direct (COD)",
      category: "Fonctions grammaticales",
    },
    {
      id: "3",
      title: "Le Complément d'Objet Indirect (COI)",
      category: "Fonctions grammaticales",
    },
    { id: "4", title: "Les Types de Phrases", category: "Syntaxe" },
    { id: "5", title: "Le Sujet du Verbe", category: "Fonctions grammaticales" },
    { id: "6", title: "Les Pronoms Personnels", category: "Classes de mots" },
    { id: "7", title: "L'Accord du Verbe", category: "Orthographe grammaticale" },
    { id: "8", title: "Les Déterminants", category: "Classes de mots" },
    { id: "9", title: "Le Complément Circonstanciel", category: "Fonctions grammaticales" },
    { id: "10", title: "Les Temps Simples", category: "Conjugaison" },
  ],
  maths: [
    { id: "11", title: "La Multiplication à 2 Chiffres", category: "Opérations" },
    { id: "12", title: "Les Fractions Simples", category: "Nombres" },
    { id: "13", title: "Le Périmètre du Rectangle", category: "Géométrie" },
    { id: "14", title: "La Division Euclidienne", category: "Opérations" },
    { id: "15", title: "Les Nombres Décimaux", category: "Nombres" },
  ],
  langue: [
    { id: "16", title: "La Compréhension de Texte", category: "Lecture" },
    { id: "17", title: "Le Récit Narratif", category: "Expression écrite" },
    { id: "18", title: "Le Vocabulaire Thématique", category: "Vocabulaire" },
  ],
};

export function LessonCatalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { niveau, domaine } = location.state || { niveau: "cm2", domaine: "grammaire" };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const lessons = lessonsCatalog[domaine] || lessonsCatalog.grammaire;
  
  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Auto-navigate after a brief moment to show selection
    setTimeout(() => {
      navigate("/preview", {
        state: { niveau, domaine, lesson },
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-[#1a365d] text-white p-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/new-fiche")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl text-white">Sélection de la Leçon</h1>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une leçon du programme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-24">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Sélectionnez une leçon du programme officiel sénégalais
            </p>
          </div>

          {/* Lessons List */}
          <div className="space-y-3">
            {filteredLessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => handleLessonSelect(lesson)}
                className={`w-full text-left bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                  selectedLesson?.id === lesson.id
                    ? "border-[#3182ce] bg-blue-50"
                    : "border-gray-200 hover:border-[#3182ce]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {selectedLesson?.id === lesson.id ? (
                      <CheckCircle2 className="w-6 h-6 text-[#3182ce]" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-[#2d3748]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#2d3748] mb-1 font-medium">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-500">{lesson.category}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredLessons.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune leçon trouvée</p>
              <p className="text-sm text-gray-400 mt-1">
                Essayez une autre recherche
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
