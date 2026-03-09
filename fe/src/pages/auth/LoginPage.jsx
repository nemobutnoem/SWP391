import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import { env } from "../../app/config/env.js";
import { LoginView } from "./LoginView.jsx";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 * Không chứa JSX UI trực tiếp.
 */
export function LoginPage() {
  const { loginFake, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.TEAM_MEMBER);
  const [name, setName] = useState("");

  const [account, setAccount] = useState("lead1");
  const [password, setPassword] = useState("Lead@123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = useMemo(
    () => [ROLES.ADMIN, ROLES.LECTURER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER],
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setIsSubmitting(true);
      if (env.useMock) {
        await loginFake({ role, name: name || account });
      } else {
        await login({ account, password });
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotPassword = (e) => {
    e.preventDefault();
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      setIsSubmitting(true);
      await loginWithGoogle({ credential: credentialResponse.credential });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Google Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google authentication failed or was cancelled.");
  };

  return (
    <LoginView
      account={account}
      password={password}
      name={name}
      role={role}
      roleOptions={roleOptions}
      error={error}
      isSubmitting={isSubmitting}
      onAccountChange={(e) => setAccount(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onNameChange={(e) => setName(e.target.value)}
      onRoleChange={(e) => setRole(e.target.value)}
      onSubmit={onSubmit}
      onForgotPassword={onForgotPassword}
      onGoogleSuccess={handleGoogleSuccess}
      onGoogleError={handleGoogleError}
    />
  );
}