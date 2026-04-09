import React, { useEffect, useMemo, useState } from "react";
import { TeamContext } from "./teamContext.js";
import { useAuth } from "../auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import { groupService } from "../../services/groups/group.service.js";
import { classService } from "../../services/classes/class.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { topicService } from "../../services/topics/topic.service.js";

const STORAGE_KEY = "swp391:team:selectedGroupId";

function safeLower(v) {
  return String(v || "").trim().toLowerCase();
}

function safeGet(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return null;
}

export function TeamContextProvider({ children }) {
  const { user } = useAuth();
  const isTeamUser = user?.role === ROLES.TEAM_LEAD || user?.role === ROLES.TEAM_MEMBER;

  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const groupOptions = useMemo(() => {
    const groupList = Array.isArray(groups) ? groups : [];
    const classList = Array.isArray(classes) ? classes : [];
    const semesterList = Array.isArray(semesters) ? semesters : [];
    const topicList = Array.isArray(topics) ? topics : [];

    return groupList
      .map((g) => {
        const groupId = Number(g.id);
        const classId = safeGet(g, ["class_id", "classId"]);
        const semesterIdFromGroup = safeGet(g, ["semester_id", "semesterId"]);
        const topicId = safeGet(g, ["project_id", "projectId"]);

        const cls = classList.find((c) => Number(c.id) === Number(classId));
        const semesterId = semesterIdFromGroup ?? safeGet(cls, ["semester_id", "semesterId"]);

        const sem = semesterList.find((s) => Number(s.id) === Number(semesterId));
        const semCode = safeGet(sem, ["code", "semester_code", "semesterCode"]);
        const semName = safeGet(sem, ["name", "semester_name", "semesterName"]);
        const semesterLabel = semCode || semName || null;

        const classCode = safeGet(cls, ["class_code", "classCode"]);
        const className = safeGet(cls, ["class_name", "className", "name"]);
        const classLabel = classCode || className || null;
        const classStatus = safeLower(safeGet(cls, ["status"])) || null;

        const t = topicList.find((x) => Number(x.id) === Number(topicId));
        const topicCode = safeGet(t, ["project_code", "code", "topic_code", "topicCode"]);
        const topicName = safeGet(t, ["project_name", "name", "topic_name", "topicName"]);
        const topicLabel = topicName || topicCode || null;

        const semesterStatus = safeLower(safeGet(sem, ["status"])) || null;
        const isUsable = semesterStatus === "active" && classStatus === "active";

        return {
          groupId: Number.isFinite(groupId) ? groupId : null,
          classId: classId == null ? null : Number(classId),
          semesterId: semesterId == null ? null : Number(semesterId),
          topicId: topicId == null ? null : Number(topicId),
          semesterLabel,
          semesterStatus,
          classLabel,
          classStatus,
          isUsable,
          topicLabel,
          raw: g,
        };
      })
      .filter((x) => x.groupId != null)
      .sort((a, b) => {
        // Prefer newest semesterId first; then groupId.
        const semA = Number(a.semesterId ?? 0);
        const semB = Number(b.semesterId ?? 0);
        if (semA !== semB) return semB - semA;
        return Number(b.groupId) - Number(a.groupId);
      });
  }, [groups, classes, semesters, topics]);

  const selectedGroup = useMemo(() => {
    if (selectedGroupId == null) return null;
    return groupOptions.find((x) => Number(x.groupId) === Number(selectedGroupId)) || null;
  }, [groupOptions, selectedGroupId]);

  const semesterOptions = useMemo(() => {
    const map = new Map();
    for (const opt of groupOptions) {
      if (opt.semesterId == null) continue;
      const key = String(opt.semesterId);
      if (!map.has(key)) {
        map.set(key, {
          semesterId: opt.semesterId,
          semesterLabel: opt.semesterLabel || `Semester ${opt.semesterId}`,
          semesterStatus: opt.semesterStatus,
        });
      }
    }
    // Prefer active semester first, then newest id.
    return Array.from(map.values()).sort((a, b) => {
      const aActive = a.semesterStatus === "active" ? 1 : 0;
      const bActive = b.semesterStatus === "active" ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return Number(b.semesterId) - Number(a.semesterId);
    });
  }, [groupOptions]);

  const pickGroupForSemester = (semesterId) => {
    const sid = Number(semesterId);
    if (!Number.isFinite(sid)) return null;
    const candidates = groupOptions.filter((g) => Number(g.semesterId) === sid);
    if (candidates.length === 0) return null;
    // Prefer usable groups (active semester + active class), then deterministic by groupId.
    candidates.sort((a, b) => {
      const ua = a.isUsable ? 1 : 0;
      const ub = b.isUsable ? 1 : 0;
      if (ua !== ub) return ub - ua;
      return Number(a.groupId) - Number(b.groupId);
    });
    return candidates[0];
  };

  const selectedSemesterId = selectedGroup?.semesterId ?? null;

  const setSelectedSemesterId = (semesterId) => {
    const picked = pickGroupForSemester(semesterId);
    if (picked?.groupId != null) {
      setSelectedGroupId(Number(picked.groupId));
    }
  };

  // Load team data once (groups + lookup tables).
  useEffect(() => {
    let cancelled = false;

    if (!isTeamUser || user?.id == null) {
      setGroups([]);
      setClasses([]);
      setSemesters([]);
      setTopics([]);
      setSelectedGroupId(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const [groupsData, classesData, semestersData, topicsData] = await Promise.all([
          groupService.list().catch(() => []),
          classService.list().catch(() => []),
          semesterService.list().catch(() => []),
          topicService.list().catch(() => []),
        ]);

        if (cancelled) return;

        const nextGroups = Array.isArray(groupsData) ? groupsData : [];
        setGroups(nextGroups);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setSemesters(Array.isArray(semestersData) ? semestersData : []);
        setTopics(Array.isArray(topicsData) ? topicsData : []);

        // Restore selection.
        let persisted = null;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const n = raw == null ? null : Number(raw);
          persisted = Number.isFinite(n) ? n : null;
        } catch {
          persisted = null;
        }

        // Determine default groupId.
        const activeSemesterIds = new Set(
          (Array.isArray(semestersData) ? semestersData : [])
            .filter((s) => safeLower(s?.status) === "active")
            .map((s) => Number(s.id))
            .filter((id) => Number.isFinite(id)),
        );

        const activeClassIds = new Set(
          (Array.isArray(classesData) ? classesData : [])
            .filter((c) => safeLower(c?.status) === "active")
            .map((c) => Number(c.id))
            .filter((id) => Number.isFinite(id)),
        );

        const eligibleGroups = nextGroups.filter((g) => {
          const semesterId = Number(safeGet(g, ["semester_id", "semesterId"]));
          const classId = Number(safeGet(g, ["class_id", "classId"]));
          return activeSemesterIds.has(semesterId) && activeClassIds.has(classId);
        });

        const allGroupIds = new Set(nextGroups.map((g) => Number(g.id)).filter((id) => Number.isFinite(id)));
        let nextSelected = persisted != null && allGroupIds.has(persisted) ? persisted : null;

        if (nextSelected == null) {
          const activeGroup = eligibleGroups[0] || null;
          nextSelected = activeGroup?.id != null ? Number(activeGroup.id) : null;
        }

        if (nextSelected == null && nextGroups.length > 0) {
          nextSelected = Number(nextGroups[0].id);
        }

        setSelectedGroupId(nextSelected);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isTeamUser, user?.id]);

  // Persist selection.
  useEffect(() => {
    if (!isTeamUser) return;
    if (selectedGroupId == null) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(selectedGroupId));
    } catch {
      // ignore
    }
  }, [isTeamUser, selectedGroupId]);

  const value = useMemo(
    () => ({
      isTeamUser,
      isLoading,
      groups,
      groupOptions,
      semesterOptions,
      selectedGroupId,
      setSelectedGroupId,
      selectedGroup,
      selectedGroupIsUsable: Boolean(selectedGroup?.isUsable),
      selectedSemesterId,
      setSelectedSemesterId,
    }),
    [
      groups,
      groupOptions,
      isLoading,
      isTeamUser,
      selectedGroup,
      selectedGroupId,
      selectedSemesterId,
      semesterOptions,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}
