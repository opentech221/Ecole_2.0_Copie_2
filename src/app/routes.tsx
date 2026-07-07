import { createBrowserRouter }    from "react-router";
import { AppLayout }              from "./components/AppLayout";
import { Dashboard }              from "./components/Dashboard";
import { ContextSelector }        from "./components/ContextSelector";
import { LessonEditor }           from "./components/LessonEditor";
import { PreviewScreen }          from "./components/PreviewScreen";
import { SuccessScreen }          from "./components/SuccessScreen";
import { PlanningScreen }         from "./components/PlanningScreen";
import { CahierRoulementScreen }  from "./components/CahierRoulementScreen";
import { ElevesScreen }           from "./components/ElevesScreen";
import { DocumentsScreen }        from "./components/DocumentsScreen";
import { LoginScreen }            from "./components/LoginScreen";
import { SignupScreen }           from "./components/SignupScreen";
import { PrivacyPolicyPage }      from "./components/PrivacyPolicyPage";
import { DataDeletionPage }       from "./components/DataDeletionPage";
import { ProfilScreen }           from "./components/ProfilScreen";
import { AbonnementScreen }       from "./components/AbonnementScreen";
import { ParametresScreen }       from "./components/ParametresScreen";
import { AdminScreen }            from "./components/AdminScreen";
import { AdminConsolePage }       from "../modules/admin/pages/AdminConsolePage";
import ErrorBoundary              from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  // ── Public auth routes ────────────────────────────────────────────────────
  { path: "/login",  element: <LoginScreen  />, errorElement: <ErrorBoundary /> },
  { path: "/signup", element: <SignupScreen />, errorElement: <ErrorBoundary /> },
  { path: "/privacy-policy", element: <PrivacyPolicyPage />, errorElement: <ErrorBoundary /> },
  { path: "/data-deletion", element: <DataDeletionPage />, errorElement: <ErrorBoundary /> },

  // ── Protected app routes (AppLayout contains auth + profile guards) ────────
  {
    path:         "/",
    element:      <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index:   true,            element: <Dashboard />,            errorElement: <ErrorBoundary /> },
      { path:    "planning",      element: <PlanningScreen />,        errorElement: <ErrorBoundary /> },
      { path:    "cahier",        element: <CahierRoulementScreen />, errorElement: <ErrorBoundary /> },
      { path:    "eleves",        element: <ElevesScreen />,          errorElement: <ErrorBoundary /> },
      { path:    "documents",     element: <DocumentsScreen />,       errorElement: <ErrorBoundary /> },
      { path:    "new-fiche",     element: <ContextSelector />,       errorElement: <ErrorBoundary /> },
      { path:    "select-lesson", element: <LessonEditor />,          errorElement: <ErrorBoundary /> },
      { path:    "preview",       element: <PreviewScreen />,         errorElement: <ErrorBoundary /> },
      { path:    "success",       element: <SuccessScreen />,         errorElement: <ErrorBoundary /> },
      { path:    "profil",        element: <ProfilScreen />,          errorElement: <ErrorBoundary /> },
      { path:    "abonnement",    element: <AbonnementScreen />,      errorElement: <ErrorBoundary /> },
      { path:    "parametres",    element: <ParametresScreen />,      errorElement: <ErrorBoundary /> },
      { path:    "admin",         element: <AdminConsolePage />,      errorElement: <ErrorBoundary /> },
      { path:    "admin/legacy",  element: <AdminScreen />,           errorElement: <ErrorBoundary /> },
    ],
  },
]);
