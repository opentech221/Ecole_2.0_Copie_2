
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { registerServiceWorker } from "./pwa/registerServiceWorker";
  import "./styles/index.css";

  registerServiceWorker();

  createRoot(document.getElementById("root")!).render(<App />);
  