import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES, ROLE_LABELS } from "../../routes/access/roles.js";

export function LoginPage() {
  const { loginFake } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.STUDENT);
  const [name, setName] = useState("");

  const roleOptions = useMemo(
    () => [ROLES.ADMIN, ROLES.LECTURER, ROLES.STUDENT],
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    await loginFake({ role, name });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>Fake Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
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

        <button type="submit" style={{ padding: 10 }}>
          Login
        </button>
      </form>
    </div>
  );
}