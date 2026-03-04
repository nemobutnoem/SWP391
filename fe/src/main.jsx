import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AppProviders } from "./providers/AppProviders.jsx";
import "./index.css";

window.onerror = (msg, url, lineNo, columnNo, error) => {
  console.error("GLOBAL ERROR CATCH:", msg, error);
  return false;
};

window.onunhandledrejection = (event) => {
  console.error("UNHANDLED REJECTION:", event.reason);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
