import { createBrowserRouter } from "react-router";
import { AppLayout }            from "./components/AppLayout";
import { Dashboard }            from "./components/Dashboard";
import { ContextSelector }      from "./components/ContextSelector";
import { LessonEditor }         from "./components/LessonEditor";
import { PreviewScreen }        from "./components/PreviewScreen";
import { SuccessScreen }        from "./components/SuccessScreen";
import { PlanningScreen }       from "./components/PlanningScreen";
import { CahierRoulementScreen} from "./components/CahierRoulementScreen";
import { ElevesScreen }         from "./components/ElevesScreen";
import { DocumentsScreen }      from "./components/DocumentsScreen";
import ErrorBoundary            from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    // Layout route — renders GlobalContextBar above every child screen.
    // errorElement captures any unhandled render/route errors and shows a
    // safe recovery UI instead of the browser's default error page.
    path:         "/",
    element:      <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index:   true,               element: <Dashboard />,            errorElement: <ErrorBoundary /> },
      { path:    "planning",         element: <PlanningScreen />,        errorElement: <ErrorBoundary /> },
      { path:    "cahier",           element: <CahierRoulementScreen />, errorElement: <ErrorBoundary /> },
      { path:    "eleves",           element: <ElevesScreen />,          errorElement: <ErrorBoundary /> },
      { path:    "documents",        element: <DocumentsScreen />,       errorElement: <ErrorBoundary /> },
      { path:    "new-fiche",        element: <ContextSelector />,       errorElement: <ErrorBoundary /> },
      { path:    "select-lesson",    element: <LessonEditor />,          errorElement: <ErrorBoundary /> },
      { path:    "preview",          element: <PreviewScreen />,         errorElement: <ErrorBoundary /> },
      { path:    "success",          element: <SuccessScreen />,         errorElement: <ErrorBoundary /> },
    ],
  },
]);
