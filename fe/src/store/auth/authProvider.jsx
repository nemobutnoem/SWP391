import React, { useMemo, useState } from "react";
import { AuthContext } from "./authContext.jsx";

const STORAGE_KEY = "swp_fake_auth";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(value) {
  try {
    if (!value) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStorage());

  const value = useMemo(() => {
    const user = session?.user || null;

    return {
      user,
      isAuthenticated: Boolean(user),
      loginFake: ({ role, name }) => {
        const next = { user: { id: "fake-1", name: name || "User", role } };
        setSession(next);
        writeStorage(next);
      },
      logout: () => {
        setSession(null);
        writeStorage(null);
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}