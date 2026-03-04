import React, { useMemo, useState } from "react";
import { AuthContext } from "./authContext.jsx";
import { env } from "../../app/config/env.js";
import { authService } from "../../services/auth/auth.service.js";
import { tokenStorage } from "../../services/auth/tokenStorage.js";
import { ROLES } from "../../routes/access/roles.js";

const STORAGE_KEY_MOCK = "swp_fake_auth";
const STORAGE_KEY_API = "swp_auth_session";

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (!value) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function mapBackendRoleToUiRole(role) {
  if (!role) return null;
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return ROLES.ADMIN;
  if (r === "LECTURER") return ROLES.LECTURER;
  if (r === "TEAM_LEAD") return ROLES.TEAM_LEAD;
  if (r === "TEAM_MEMBER") return ROLES.TEAM_MEMBER;
  // backward compat (old FE tokens / mock)
  if (r === "STUDENT") return ROLES.TEAM_MEMBER;
  return role;
}

function readInitialSession() {
  if (env.useMock) return readStorage(STORAGE_KEY_MOCK);
  const token = tokenStorage.get();
  if (!token) return null;
  return readStorage(STORAGE_KEY_API);
}

export function AuthProvider({ children }) {
  // IMPORTANT: init from storage
  const [session, setSession] = useState(() => readInitialSession());

  const value = useMemo(() => {
    const user = session?.user || null;

    return {
      user,
      isAuthenticated: Boolean(user),
      login: async ({ account, password }) => {
        if (env.useMock) {
          throw new Error("login is not available in mock mode");
        }
        const res = await authService.login({ account, password });
        const next = {
          user: {
            id: res?.userId,
            name: account || "User",
            role: mapBackendRoleToUiRole(res?.role),
          },
        };
        setSession(next);
        writeStorage(STORAGE_KEY_API, next);
        return next;
      },
      loginFake: async ({ role, name }) => {
        if (!env.useMock && typeof authService.loginFake !== "function") {
          throw new Error("Fake login is disabled");
        }
        const next = env.useMock
          ? await authService.loginFake({ role, name })
          : { user: { id: "fake-1", name: name || "User", role } };
        setSession(next);
        writeStorage(STORAGE_KEY_MOCK, next);
        return next;
      },
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          tokenStorage.clear();
        }
        setSession(null);
        writeStorage(STORAGE_KEY_MOCK, null);
        writeStorage(STORAGE_KEY_API, null);
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}