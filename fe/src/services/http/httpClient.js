import { env } from "../../app/config/env.js";

function buildUrl(path) {
  const base = (env.apiUrl || "").replace(/\/+$/, "");
  const p = String(path || "");
  if (!base) return p;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}

async function parseBody(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export class HttpError extends Error {
  constructor({ status, data, message }) {
    super(message || `HTTP Error ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

export const http = {
  async request(method, path, { body, headers, signal } = {}) {
    const res = await fetch(buildUrl(path), {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    const data = await parseBody(res);
    if (!res.ok) {
      throw new HttpError({
        status: res.status,
        data,
        message:
          (typeof data === "object" && data && (data.message || data.error)) ||
          (typeof data === "string" ? data : "") ||
          `Request failed with status ${res.status}`,
      });
    }
    return { status: res.status, data, headers: res.headers };
  },
  get(path, opts) {
    return this.request("GET", path, opts);
  },
  post(path, body, opts) {
    return this.request("POST", path, { ...(opts || {}), body });
  },
  patch(path, body, opts) {
    return this.request("PATCH", path, { ...(opts || {}), body });
  },
  put(path, body, opts) {
    return this.request("PUT", path, { ...(opts || {}), body });
  },
  delete(path, opts) {
    return this.request("DELETE", path, opts);
  },
};