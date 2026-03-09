import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "../../components/common/Button.jsx";
import { ROLE_LABELS } from "../../routes/access/roles.js";
import { env } from "../../app/config/env.js";
import "./loginPage.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function LoginView({
  account,
  password,
  name,
  role,
  roleOptions,
  error,
  isSubmitting,
  onAccountChange,
  onPasswordChange,
  onNameChange,
  onRoleChange,
  onSubmit,
  onForgotPassword,
  onGoogleSuccess,
  onGoogleError,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            SWP
          </div>
          <h1 className="auth-title">Software Project Workspace</h1>
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
              onChange={env.useMock ? onNameChange : onAccountChange}
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
                onChange={onPasswordChange}
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
              <select
                id="loginRole"
                value={role}
                onChange={onRoleChange}
              >
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
              {isSubmitting ? "Signing in…" : "Login"}
            </Button>
          </div>

          <div className="auth-divider" style={{ margin: "20px 0", textAlign: "center", textTransform: "uppercase", fontSize: "0.85rem", color: "#666" }}>
            <span>Or</span>
          </div>

          <div className="google-login-container" style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              useOneTap
              theme="filled_blue"
              text="continue_with"
            />
          </div>
        </form>

        <footer className="auth-footer">© SWP Project — Academic Use Only</footer>
      </div>
    </div>
  );
}
