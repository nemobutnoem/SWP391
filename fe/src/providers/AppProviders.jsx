import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../store/auth/authProvider.jsx";
import { TeamContextProvider } from "../store/teamContext/TeamContextProvider.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { env } from "../app/config/env.js";

export function AppProviders({ children }) {
  return (
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <TeamContextProvider>{children}</TeamContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}