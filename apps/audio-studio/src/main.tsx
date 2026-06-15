import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@neon-cabinet/ui/components/ui/tooltip";
import App from "./App";
import "@neon-cabinet/ui/styles/globals.css";
import "./styles/compose.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
);
