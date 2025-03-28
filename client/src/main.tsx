import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/auth-context";
import { UIProvider } from "./context/ui-context";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <UIProvider>
      <App />
    </UIProvider>
  </AuthProvider>
);
