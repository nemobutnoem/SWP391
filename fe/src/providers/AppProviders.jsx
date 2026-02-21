import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../store/auth/auth.context.jsx";

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}