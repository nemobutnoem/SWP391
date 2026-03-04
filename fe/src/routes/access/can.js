import { ROLE_PERMISSIONS } from "./permissions.js";

export function can(role, permission) {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}