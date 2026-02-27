import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES, ROLE_LABELS } from "../../routes/access/roles.js";
import { env } from "../../app/config/env.js";

export function LoginPage() {
  const { loginFake, login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.TEAM_MEMBER);
  const [name, setName] = useState("");

  const [account, setAccount] = useState("lead1");
  const [password, setPassword] = useState("Lead@123");
  const [error, setError] = useState("");

  const roleOptions = useMemo(
    () => [ROLES.ADMIN, ROLES.LECTURER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER],
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (env.useMock) {
        await loginFake({ role, name });
      } else {
        await login({ account, password });
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>{env.useMock ? "Fake Login" : "Login"}</h2>

      {!env.useMock && (
        <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.8 }}>
          Seed accounts (SQL Server): <b>lead1 / Lead@123</b> or <b>mem1 / Mem@123</b>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 12, color: "crimson" }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {env.useMock ? (
          <>
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{ width: "100%", padding: 8 }}
              />
            </label>

            <label>
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              Account
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="lead1"
                style={{ width: "100%", padding: 8 }}
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lead@123"
                style={{ width: "100%", padding: 8 }}
                autoComplete="current-password"
              />
            </label>
          </>
        )}

        <button type="submit" style={{ padding: 10 }}>
          Login
        </button>
      </form>
    </div>
  );
}