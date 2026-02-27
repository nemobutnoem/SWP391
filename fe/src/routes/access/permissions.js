import { ROLES } from "./roles.js";

export const PERMISSIONS = Object.freeze({
  MANAGE_TOPICS: "manage_topics",
  VIEW_PROGRESS: "view_progress",
  MANAGE_WORK: "manage_work", // issues/tasks/sprints/board (team side)
  SYNC: "sync",
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [PERMISSIONS.MANAGE_TOPICS],

  [ROLES.LECTURER]: [PERMISSIONS.VIEW_PROGRESS],

  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.MANAGE_WORK,
    PERMISSIONS.VIEW_PROGRESS,
    PERMISSIONS.SYNC,
  ],

  [ROLES.TEAM_MEMBER]: [
    PERMISSIONS.MANAGE_WORK,
    PERMISSIONS.VIEW_PROGRESS,
    PERMISSIONS.SYNC,
  ],
});