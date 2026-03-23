import React from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #e0effe 100%)",
    padding: "2rem",
  },
  card: {
    textAlign: "center",
    maxWidth: 440,
    animation: "fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)",
  },
  code: {
    fontSize: "8rem",
    fontWeight: 800,
    fontFamily: "var(--font-heading)",
    background: "linear-gradient(135deg, var(--brand-400), var(--brand-700))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1,
    marginBottom: "0.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--slate-900)",
    marginBottom: "0.75rem",
  },
  desc: {
    color: "var(--slate-500)",
    fontSize: "1rem",
    lineHeight: 1.6,
    marginBottom: "2rem",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, var(--brand-600), var(--brand-500))",
    color: "white",
    border: "none",
    borderRadius: "var(--radius-md)",
    fontSize: "0.9375rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(14,165,233,0.3)",
    transition: "all 0.25s",
  },
};

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.code}>404</div>
        <h2 style={styles.title}>Page Not Found</h2>
        <p style={styles.desc}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <button
          style={styles.btn}
          onClick={() => navigate("/dashboard")}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
