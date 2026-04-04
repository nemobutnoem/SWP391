import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import { studentService } from "../../services/students/student.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { classService } from "../../services/classes/class.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { topicService } from "../../services/topics/topic.service.js";
import "./topbar.css";

const PATH_LABELS = {
  dashboard: "Overview",
  topics: "Project Topics",
  tasks: "Working Board",
  activity: "Commits Stream",
  sync: "Code Activities",
  account: "Account Settings",
};

export function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [studyContext, setStudyContext] = useState({ semesterLabel: null, classLabel: null, topicLabel: null });
  const location = useLocation();
  const navigate = useNavigate();

  const isTeamUser = user?.role === ROLES.TEAM_LEAD || user?.role === ROLES.TEAM_MEMBER;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isTeamUser || user?.id == null) {
        setStudyContext({ semesterLabel: null, classLabel: null, topicLabel: null });
        return;
      }

      try {
        // Prefer group context from /groups (stable endpoint)
        const groups = await groupService.list().catch(() => []);
        const myGroup = Array.isArray(groups) ? groups[0] : null;

        let classId = myGroup?.class_id ?? myGroup?.classId ?? null;
        let semesterId = myGroup?.semester_id ?? myGroup?.semesterId ?? null;

        const topicId = myGroup?.project_id ?? myGroup?.projectId ?? null;
        let topicLabel = null;
        if (topicId != null) {
          const topics = await topicService.list().catch(() => []);
          const t = (Array.isArray(topics) ? topics : []).find((x) => Number(x.id) === Number(topicId));
          const code = t?.project_code ?? t?.code ?? t?.topic_code ?? t?.topicCode;
          const name = t?.project_name ?? t?.name ?? t?.topic_name ?? t?.topicName;
          topicLabel = name || code || null;
        }

        // Fallback: derive from student record (if context missing)
        if (classId == null) {
          const students = await studentService.list().catch(() => []);
          const uid = Number(user.id);
          const me = Number.isFinite(uid)
            ? (Array.isArray(students) ? students : []).find((s) => Number(s.user_id ?? s.userId) === uid)
            : null;
          classId = me?.class_id ?? me?.classId ?? null;
        }

        let classLabel = null;
        let semesterLabel = null;

        const classes = await classService.list();
        const cls = (Array.isArray(classes) ? classes : []).find((c) => Number(c.id) === Number(classId));
        if (cls) {
          const code = cls.class_code ?? cls.classCode;
          const name = cls.class_name ?? cls.className;
          classLabel = code || name || null;

          if (semesterId == null) {
            semesterId = cls.semester_id ?? cls.semesterId ?? null;
          }
        }

        if (semesterId != null) {
          const semesters = await semesterService.list();
          const sem = (Array.isArray(semesters) ? semesters : []).find((s) => Number(s.id) === Number(semesterId));
          if (sem) {
            const semCode = sem.code ?? sem.semester_code ?? sem.semesterCode;
            const semName = sem.name ?? sem.semester_name ?? sem.semesterName;
            semesterLabel = semCode || semName || null;
          }
        }

        if (!cancelled) setStudyContext({ semesterLabel, classLabel, topicLabel });
      } catch {
        if (!cancelled) setStudyContext({ semesterLabel: null, classLabel: null, topicLabel: null });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isTeamUser, user?.id]);

  const currentPath =
    location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const pathLabel = PATH_LABELS[currentPath] || "Page";

  const initials = useMemo(() => {
    const safeName =
      typeof user?.name === "string" ? user.name : user?.account || "Guest";
    return (
      safeName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "JD"
    );
  }, [user]);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div>
          <div className="breadcrumb">
            <span>{user?.role || "User"}</span>
            <span>/</span>
            <span className="breadcrumb__item">{pathLabel}</span>
          </div>

          {isTeamUser && (
            <div className="topbar__study-context">
              <span className="topbar__value">Semester: {studyContext.semesterLabel || "-"}</span>
              <span className="topbar__dot">•</span>
              <span className="topbar__value">Class: {studyContext.classLabel || "-"}</span>
              <span className="topbar__dot">•</span>
              <span className="topbar__value topbar__topic">Topic: {studyContext.topicLabel || "-"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="topbar__right">
        <div className="user-wrap" style={{ position: "relative" }}>
          <button
            className="topbar__user-btn"
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            <div className="topbar__avatar">{initials}</div>
            <span className="topbar__name">
              {typeof user?.name === "string" ? user.name : user?.account || "Member"}
            </span>
            <span className="topbar__chev">{open ? "^" : "v"}</span>
          </button>

          {open && (
            <div className="dropdown" onMouseLeave={() => setOpen(false)}>
              <div className="dropdown__header">
                <span className="dropdown__name">
                  {typeof user?.name === "string" ? user.name : user?.account || "Member"}
                </span>
                <span className="dropdown__role">{user?.role}</span>
              </div>
              <button
                className="dropdown__item"
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/account");
                }}
              >
                <span>Profile</span> Account Settings
              </button>
              <button
                className="dropdown__item dropdown__item--danger"
                type="button"
                onClick={logout}
              >
                <span>Exit</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

