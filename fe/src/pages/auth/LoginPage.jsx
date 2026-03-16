import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES, ROLE_LABELS } from "../../routes/access/roles.js";
import { env } from "../../app/config/env.js";
import { Button } from "../../components/common/Button.jsx";
import { GoogleLogin } from "@react-oauth/google";
import "./loginPage.css";

export function LoginPage() {
  const { loginFake, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.TEAM_MEMBER);
  const [googleAccountType, setGoogleAccountType] = useState("STUDENT");
  const [name, setName] = useState("");

  const [account, setAccount] = useState("lead1");
  const [password, setPassword] = useState("Lead@123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = useMemo(
    () => [ROLES.ADMIN, ROLES.LECTURER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER],
    []
  );

  const googleRoleOptions = useMemo(
    () => [
      { value: "STUDENT", label: "Student" },
      { value: "LECTURER", label: "Lecturer" },
    ],
    [],
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
      await loginWithGoogle({
        credential: credentialResponse.credential,
        accountType: googleAccountType,
      });
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
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            SWP
          </div>
          <h1 className="auth-title">Software Development Project</h1>
          <p className="auth-subtitle">Student Project Management System</p>
        </header>

        {error && (
          <div className="auth-alert auth-alert--danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="loginAccount">Username</label>
            <input
              id="loginAccount"
              value={env.useMock ? name : account}
              onChange={(e) =>
                env.useMock ? setName(e.target.value) : setAccount(e.target.value)
              }
              placeholder={
                env.useMock
                  ? "Enter your username"
                  : "lead1 | mem1 | admin1 | lec1"
              }
              autoComplete="username"
              autoFocus
            />
          </div>

          {!env.useMock && (
            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          )}

          <div className="auth-links">
            <a className="auth-forgot" href="#" onClick={onForgotPassword}>
              Forgot password?
            </a>
          </div>

          {env.useMock && (
            <div className="form-group auth-role">
              <label htmlFor="loginRole">Role</label>
              <select id="loginRole" value={role} onChange={(e) => setRole(e.target.value)}>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="auth-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="auth-primary-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </div>

          <div className="auth-divider">
            <span>Or</span>
          </div>

          <div className="auth-google-panel">
            <div className="form-group auth-role auth-google-role">
              <label htmlFor="googleAccountType">Sign in with Google as</label>
              <select
                id="googleAccountType"
                value={googleAccountType}
                onChange={(e) => setGoogleAccountType(e.target.value)}
                disabled={isSubmitting}
              >
                {googleRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-google-hint">
              New Google accounts will be created with the selected account type.
            </div>

            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                text="continue_with"
              />
            </div>
          </div>
        </form>

        <footer className="auth-footer">Academic Use Only</footer>
      </div>
    </div>
  );
}
