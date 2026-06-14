import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@neon-cabinet/ui/styles/globals.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
