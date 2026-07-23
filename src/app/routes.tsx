import { createBrowserRouter } from "react-router";
import React, { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

const AppLayout = lazy(() => import("./components/AppLayout").then((mod) => ({ default: mod.AppLayout })));
const Dashboard = lazy(() => import("./components/Dashboard").then((mod) => ({ default: mod.Dashboard })));
const ContextSelector = lazy(() => import("./components/ContextSelector").then((mod) => ({ default: mod.ContextSelector })));
const LessonEditor = lazy(() => import("./components/LessonEditor").then((mod) => ({ default: mod.LessonEditor })));
const PreviewScreen = lazy(() => import("./components/PreviewScreen").then((mod) => ({ default: mod.PreviewScreen })));
const SuccessScreen = lazy(() => import("./components/SuccessScreen").then((mod) => ({ default: mod.SuccessScreen })));
const PlanningScreen = lazy(() => import("./components/PlanningScreen").then((mod) => ({ default: mod.PlanningScreen })));
const CahierRoulementScreen = lazy(() => import("./components/CahierRoulementScreen").then((mod) => ({ default: mod.CahierRoulementScreen })));
const ElevesScreen = lazy(() => import("./components/ElevesScreen").then((mod) => ({ default: mod.ElevesScreen })));
const DocumentsScreen = lazy(() => import("./components/DocumentsScreen").then((mod) => ({ default: mod.DocumentsScreen })));
const LoginScreen = lazy(() => import("./components/LoginScreen").then((mod) => ({ default: mod.LoginScreen })));
const SignupScreen = lazy(() => import("./components/SignupScreen").then((mod) => ({ default: mod.SignupScreen })));
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage").then((mod) => ({ default: mod.PrivacyPolicyPage })));
const DataDeletionPage = lazy(() => import("./components/DataDeletionPage").then((mod) => ({ default: mod.DataDeletionPage })));
const ProtectedAppShell = lazy(() => import("./components/ProtectedAppShell").then((mod) => ({ default: mod.ProtectedAppShell })));
const ProfilScreen = lazy(() => import("./components/ProfilScreen").then((mod) => ({ default: mod.ProfilScreen })));
const AbonnementScreen = lazy(() => import("./components/AbonnementScreen").then((mod) => ({ default: mod.AbonnementScreen })));
const ParametresScreen = lazy(() => import("./components/ParametresScreen").then((mod) => ({ default: mod.ParametresScreen })));
const AdminScreen = lazy(() => import("./components/AdminScreen").then((mod) => ({ default: mod.AdminScreen })));
const AdminModuleLayout = lazy(() => import("../modules/admin/pages/AdminModuleLayout").then((mod) => ({ default: mod.AdminModuleLayout })));
const AdminConsolePage = lazy(() => import("../modules/admin/pages/AdminConsolePage").then((mod) => ({ default: mod.AdminConsolePage })));
const AdminSaasPage = lazy(() => import("../modules/admin/pages/AdminSaasPage").then((mod) => ({ default: mod.AdminSaasPage })));
const NotificationsPage = lazy(() => import("../modules/notifications/pages/NotificationsPage").then((mod) => ({ default: mod.NotificationsPage })));
const ProgrammePage = lazy(() => import("../modules/programme/pages/ProgrammePage").then((mod) => ({ default: mod.ProgrammePage })));

function lazyRoute(element: React.ReactElement) {
  return <Suspense fallback={null}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  // ── Public auth routes ────────────────────────────────────────────────────
  { path: "/login",  element: lazyRoute(<LoginScreen  />), errorElement: <ErrorBoundary /> },
  { path: "/signup", element: lazyRoute(<SignupScreen />), errorElement: <ErrorBoundary /> },
  { path: "/privacy-policy", element: lazyRoute(<PrivacyPolicyPage />), errorElement: <ErrorBoundary /> },
  { path: "/data-deletion", element: lazyRoute(<DataDeletionPage />), errorElement: <ErrorBoundary /> },

  // ── Protected app routes (AppLayout contains auth + profile guards) ────────
  {
    path:         "/",
    element:      lazyRoute(<ProtectedAppShell />),
    errorElement: <ErrorBoundary />,
    children: [
      { index:   true,            element: lazyRoute(<Dashboard />),            errorElement: <ErrorBoundary /> },
      { path:    "planning",      element: lazyRoute(<PlanningScreen />),        errorElement: <ErrorBoundary /> },
      { path:    "cahier",        element: lazyRoute(<CahierRoulementScreen />), errorElement: <ErrorBoundary /> },
      { path:    "eleves",        element: lazyRoute(<ElevesScreen />),          errorElement: <ErrorBoundary /> },
      { path:    "documents",     element: lazyRoute(<DocumentsScreen />),       errorElement: <ErrorBoundary /> },
      { path:    "new-fiche",     element: lazyRoute(<ContextSelector />),       errorElement: <ErrorBoundary /> },
      { path:    "select-lesson", element: lazyRoute(<LessonEditor />),          errorElement: <ErrorBoundary /> },
      { path:    "preview",       element: lazyRoute(<PreviewScreen />),         errorElement: <ErrorBoundary /> },
      { path:    "success",       element: lazyRoute(<SuccessScreen />),         errorElement: <ErrorBoundary /> },
      { path:    "profil",        element: lazyRoute(<ProfilScreen />),          errorElement: <ErrorBoundary /> },
      { path:    "abonnement",    element: lazyRoute(<AbonnementScreen />),      errorElement: <ErrorBoundary /> },
      { path:    "parametres",    element: lazyRoute(<ParametresScreen />),      errorElement: <ErrorBoundary /> },
      { path:    "notifications", element: lazyRoute(<NotificationsPage />),      errorElement: <ErrorBoundary /> },
      {
        path: "admin",
        element: lazyRoute(<AdminModuleLayout />),
        errorElement: <ErrorBoundary />,
        children: [
          { index: true, element: lazyRoute(<AdminConsolePage />), errorElement: <ErrorBoundary /> },
          { path: "saas", element: lazyRoute(<AdminSaasPage />), errorElement: <ErrorBoundary /> },
          { path: "legacy", element: lazyRoute(<AdminScreen />), errorElement: <ErrorBoundary /> },
        ],
      },
      { path:    "programme",     element: lazyRoute(<ProgrammePage />),         errorElement: <ErrorBoundary /> },
    ],
  },
]);
