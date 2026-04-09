import React, { useEffect, useState, useMemo } from "react";
import { groupService } from "../../services/groups/group.service.js";
import { studentService } from "../../services/students/student.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { topicService } from "../../services/topics/topic.service.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { syncService } from "../../services/sync/sync.service.js";
import { MyGroupsView } from "./MyGroupsView.jsx";
import "../admin/adminManagement.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function MyGroupsPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [topics, setTopics] = useState([]);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [topicSelections, setTopicSelections] = useState({});

  const [semesters, setSemesters] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Add-member modal state
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);
  const [fetchingGroupId, setFetchingGroupId] = useState(null);
  const [fetchStatusByGroupId, setFetchStatusByGroupId] = useState({});
  const [autoSyncAttemptedScopes, setAutoSyncAttemptedScopes] = useState({});

  const LEGACY_DROPPED_MEMBERS_STORAGE_KEY = "swp391:lecturer:droppedMembersByGroup";
  const SCOPED_DROPPED_MEMBERS_STORAGE_KEY = "swp391:lecturer:droppedMembersBySemesterBlock";

  const loadJsonObject = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveJsonObject = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value || {}));
    } catch {
      // ignore
    }
  };

  const getGroupScopeKey = (group, classes) => {
    const semesterId = group?.semester_id ?? group?.semesterId ?? "unknown";
    const classId = group?.class_id ?? group?.classId;
    const clazz = (Array.isArray(classes) ? classes : []).find((c) => Number(c.id) === Number(classId));
    const classType = String(clazz?.class_type ?? clazz?.classType ?? "MAIN").toUpperCase();
    return `${semesterId}|${classType === "CAPSTONE" ? "CAPSTONE" : "MAIN"}`;
  };

  const migrateLegacyDropped = (legacyByGroup, groups, classes) => {
    const scoped = {};
    const legacy = legacyByGroup && typeof legacyByGroup === "object" ? legacyByGroup : {};

    Object.entries(legacy).forEach(([gid, memberIds]) => {
      const group = (Array.isArray(groups) ? groups : []).find((g) => Number(g.id) === Number(gid));
      const scopeKey = group ? getGroupScopeKey(group, classes) : `unknown|MAIN`;
      if (!scoped[scopeKey]) scoped[scopeKey] = {};
      scoped[scopeKey][String(gid)] = Array.isArray(memberIds) ? memberIds.map(Number) : [];
    });

    return scoped;
  };

  const loadData = async () => {
    const [groupsData, membersData, studentsData, gradesData, topicsData, semestersData, classesData, jiraData] = await Promise.all([
      groupService.list().catch(() => []),
      groupService.listMembers().catch(() => []),
      studentService.list().catch(() => []),
      gradeService.list().catch(() => []),
      topicService.list().catch(() => []),
      semesterService.list().catch(() => []),
      classService.list().catch(() => []),
      jiraTaskService.list().catch(() => []),
    ]);

    const groupsList = Array.isArray(groupsData) ? groupsData : [];
    const classesList = Array.isArray(classesData) ? classesData : [];

    // Load scoped drop map; migrate legacy (by group) when needed.
    const scopedDropped = loadJsonObject(SCOPED_DROPPED_MEMBERS_STORAGE_KEY);
    const legacyDropped = loadJsonObject(LEGACY_DROPPED_MEMBERS_STORAGE_KEY);
    const hasScoped = scopedDropped && Object.keys(scopedDropped).length > 0;
    const migrated = !hasScoped && legacyDropped && Object.keys(legacyDropped).length > 0
      ? migrateLegacyDropped(legacyDropped, groupsList, classesList)
      : null;
    const effectiveScopedDropped = migrated || scopedDropped;
    if (migrated) {
      saveJsonObject(SCOPED_DROPPED_MEMBERS_STORAGE_KEY, migrated);
    }

    const nextMembers = (Array.isArray(membersData) ? membersData : []).map((m) => {
      const gid = Number(m.group_id ?? m.groupId);
      const mid = Number(m.id ?? m.member_id ?? m.memberId);
      const group = groupsList.find((g) => Number(g.id) === gid);
      const scopeKey = group ? getGroupScopeKey(group, classesList) : `unknown|MAIN`;
      const droppedList = effectiveScopedDropped?.[scopeKey]?.[String(gid)];
      const isDropped = Array.isArray(droppedList) && droppedList.map(Number).includes(mid);
      return isDropped ? { ...m, isDropped: true } : m;
    });

    setAllGroups(groupsList);
    setAllClasses(classesList);
    setAllMembers(nextMembers);
    setStudents(Array.isArray(studentsData) ? studentsData : []);
    setGrades(Array.isArray(gradesData) ? gradesData : []);
    setTopics(Array.isArray(topicsData) ? topicsData : []);
    setJiraTasks(Array.isArray(jiraData) ? jiraData : []);

    const semesterList = Array.isArray(semestersData) ? semestersData : [];
    setSemesters(semesterList);
    const active = semesterList.find((s) => String(s.status || "").toLowerCase() === "active");
    if (active) setSelectedSemesterId(active.id);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setTopicSelections(
      Object.fromEntries(
        allGroups.map((g) => [g.id, g.project_id ?? g.projectId ?? ""]),
      ),
    );
  }, [allGroups]);

  // Filter groups by selected semester/class (optional)
  const myGroups = useMemo(() => {
    const bySem = selectedSemesterId
      ? allGroups.filter((g) => (g.semester_id ?? g.semesterId) === selectedSemesterId)
      : allGroups;
    const byClass = selectedClassId
      ? bySem.filter((g) => (g.class_id ?? g.classId) === selectedClassId)
      : bySem;
    return byClass;
  }, [allGroups, selectedSemesterId, selectedClassId]);

  const tasksForSelectedGroupsCount = useMemo(() => {
    const groupIds = new Set(myGroups.map((g) => Number(g.id)));
    return jiraTasks.filter((task) => groupIds.has(Number(task.group_id ?? task.groupId))).length;
  }, [myGroups, jiraTasks]);

  useEffect(() => {
    const groupIds = myGroups.map((g) => Number(g.id)).filter((id) => Number.isFinite(id) && id > 0);
    if (groupIds.length === 0) return;
    if (tasksForSelectedGroupsCount > 0) return;

    const scopeKey = `${selectedSemesterId ?? "all"}|${selectedClassId ?? "all"}`;
    if (autoSyncAttemptedScopes[scopeKey]) return;

    setAutoSyncAttemptedScopes((prev) => ({ ...prev, [scopeKey]: true }));

    (async () => {
      try {
        await Promise.allSettled(
          groupIds.flatMap((groupId) => [
            syncService.syncJira({ groupId }),
            syncService.syncGithub({ groupId }),
          ]),
        );

        const jiraData = await jiraTaskService.list().catch(() => []);
        setJiraTasks(Array.isArray(jiraData) ? jiraData : []);
      } catch {
        // Silent background sync: keep UI usable even if integration for some groups is missing.
      }
    })();
  }, [
    myGroups,
    tasksForSelectedGroupsCount,
    selectedSemesterId,
    selectedClassId,
    autoSyncAttemptedScopes,
  ]);

  const enrichedGroups = useMemo(() => {
    const toNumberOrNull = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const normalizeText = (v) =>
      v == null
        ? ""
        : String(v)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .trim()
          .toLowerCase();
    const getStoryPoints = (task) => Number(task.story_points ?? task.storyPoints ?? 0);
    const getTaskAssigneeKeys = (task) => {
      const keys = new Set();
      const assigneeUserId = toNumberOrNull(task.assigneeUserId ?? task.assignee_user_id);
      if (assigneeUserId != null && assigneeUserId > 0) {
        keys.add(`uid:${assigneeUserId}`);
      }
      const assigneeName = normalizeText(task.assigneeName ?? task.assignee_name);
      if (assigneeName) {
        keys.add(`name:${assigneeName}`);
      }
      return keys;
    };

    return myGroups.map((g) => {
      const groupTasks = jiraTasks.filter((task) => Number(task.group_id ?? task.groupId) === Number(g.id));

      const scoredTasks = groupTasks
        .map((task) => ({
          task,
          storyPoints: getStoryPoints(task),
          assigneeKeys: getTaskAssigneeKeys(task),
        }))
        .filter(({ storyPoints, assigneeKeys }) => Number.isFinite(storyPoints) && storyPoints > 0 && assigneeKeys.size > 0);

      const totalStoryPoints = scoredTasks.reduce(
        (sum, item) => sum + item.storyPoints,
        0,
      );

      const members = allMembers
        .filter((m) => Number(m.group_id ?? m.groupId) === Number(g.id))
        .map((m) => {
          const student = students.find((s) => Number(s.id) === Number(m.student_id ?? m.studentId));
          const memberUserId = toNumberOrNull(student?.user_id ?? student?.userId ?? m.user_id ?? m.userId);
          const memberKeys = new Set();
          if (memberUserId != null) memberKeys.add(`uid:${memberUserId}`);
          const account = normalizeText(student?.account ?? m.account);
          if (account) memberKeys.add(`name:${account}`);
          const fullName = normalizeText(student?.full_name ?? student?.fullName ?? m.full_name ?? m.fullName);
          if (fullName) memberKeys.add(`name:${fullName}`);
          const studentCode = normalizeText(student?.student_code ?? student?.studentCode ?? m.student_code);
          if (studentCode) memberKeys.add(`name:${studentCode}`);
          const email = normalizeText(student?.email ?? m.email);
          const emailPrefix = email ? email.split('@')[0] : "";
          if (emailPrefix) memberKeys.add(`name:${emailPrefix}`);

          const memberStoryPoints = scoredTasks
            .filter(({ assigneeKeys }) => {
              for (const key of memberKeys) {
                if (assigneeKeys.has(key)) return true;
              }
              for (const aKey of assigneeKeys) {
                if (studentCode && aKey.includes(studentCode)) return true;
                if (emailPrefix && aKey.includes(emailPrefix)) return true;
                if (account && aKey.includes(account)) return true;
              }
              return false;
            })
            .reduce((sum, item) => sum + item.storyPoints, 0);

          const pct = totalStoryPoints > 0 ? (memberStoryPoints / totalStoryPoints) * 100 : 0;

          return {
            ...student,
            ...m,
            member_id: m.id,
            member_story_points: memberStoryPoints,
            contribution_pct: totalStoryPoints > 0 ? Number(pct.toFixed(1)) : null,
          };
        });

      const groupGrades = grades.filter(
        (gr) => Number(gr.group_id ?? gr.groupId) === Number(g.id),
      );
      const topic = topics.find((t) => t.id === (g.project_id ?? g.projectId));
      const gradedGrades = groupGrades.filter((gr) => gr.score !== null);
      const avgScore =
        gradedGrades.length > 0
          ? (gradedGrades.reduce((s, gr) => s + gr.score, 0) / gradedGrades.length).toFixed(1)
          : null;

      return {
        ...g,
        members,
        groupGrades,
        avgScore,
        topicName: topic?.name || null,
        totalStoryPoints,
        hasContributionData: totalStoryPoints > 0,
      };
    });
  }, [myGroups, allMembers, students, grades, topics, jiraTasks]);

  const toggleExpand = (id) =>
    setExpandedGroupId(expandedGroupId === id ? null : id);

  const isLeaderRole = (role) => String(role || "").trim().toLowerCase() === "leader";

  const handleRoleChange = async (groupId, memberId, newRole) => {
    const targetMembers = allMembers.filter(
      (m) => Number(m.group_id ?? m.groupId) === Number(groupId),
    );
    const previousLeader = isLeaderRole(newRole)
      ? targetMembers.find(
          (m) => Number(m.id) !== Number(memberId) && isLeaderRole(m.role_in_group ?? m.roleInGroup),
        )
      : null;

    try {
      if (previousLeader) {
        await groupService.updateMemberRole(previousLeader.id, "Member");
      }
      await groupService.updateMemberRole(memberId, newRole);
      setAllMembers((prev) =>
        prev.map((m) => {
          if (previousLeader && Number(m.id) === Number(previousLeader.id)) {
            return { ...m, role_in_group: "Member" };
          }
          if (Number(m.id) === Number(memberId)) {
            return { ...m, role_in_group: newRole };
          }
          return m;
        }),
      );
    } catch (err) {
      alert("Failed to update role: " + (err.message || err));
    }
  };

  const handleAddMember = async (groupId, studentId, role) => {
    try {
      if (isLeaderRole(role)) {
        const previousLeader = allMembers.find(
          (m) =>
            Number(m.group_id ?? m.groupId) === Number(groupId) &&
            isLeaderRole(m.role_in_group ?? m.roleInGroup),
        );
        if (previousLeader) {
          await groupService.updateMemberRole(previousLeader.id, "Member");
        }
      }
      await groupService.addMember(groupId, studentId, role);
      loadData();
    } catch (err) {
      alert("Failed to add member: " + (err.response?.data?.message || err.message || err));
    }
  };

  // Đánh rớt sinh viên: chỉ mờ dòng trong UI, không xóa khỏi group trong DB
  const handleDropMember = async (groupId, memberId) => {
    if (!window.confirm("Bạn có chắc muốn đánh rớt sinh viên này không?")) return;
    try {
      // Persist to localStorage for visual history (mờ đi)
      const gid = Number(groupId);
      const mid = Number(memberId);
      const group = allGroups.find((g) => Number(g.id) === gid);
      const scopeKey = group ? getGroupScopeKey(group, allClasses) : `unknown|MAIN`;

      const scopedDropped = loadJsonObject(SCOPED_DROPPED_MEMBERS_STORAGE_KEY);
      const prevScope = scopedDropped?.[scopeKey] && typeof scopedDropped[scopeKey] === "object" ? scopedDropped[scopeKey] : {};
      const prevList = Array.isArray(prevScope[String(gid)]) ? prevScope[String(gid)] : [];
      const nextList = Array.from(new Set([...prevList.map(Number), mid]));

      const nextScoped = {
        ...scopedDropped,
        [scopeKey]: {
          ...prevScope,
          [String(gid)]: nextList,
        },
      };
      saveJsonObject(SCOPED_DROPPED_MEMBERS_STORAGE_KEY, nextScoped);

      // Update local state immediately so row turns gray without deleting member.
      setAllMembers((prev) =>
        prev.map((m) =>
          Number(m.id ?? m.member_id ?? m.memberId) === mid && Number(m.group_id ?? m.groupId) === gid
            ? { ...m, isDropped: true }
            : m,
        ),
      );
    } catch (err) {
      alert("Đánh rớt thất bại: " + (err.response?.data?.message || err.message || err));
    }
  };

  const handleTopicSelectionChange = (groupId, topicId) => {
    setTopicSelections((prev) => ({
      ...prev,
      [groupId]: topicId ? Number(topicId) : "",
    }));
  };

  const handleAssignTopic = async (groupId) => {
    try {
      const topicId = topicSelections[groupId];
      if (!topicId) {
        alert("Please select a topic first.");
        return;
      }
      await groupService.assignTopicAdmin(groupId, topicId);
      loadData();
    } catch (err) {
      alert("Failed to assign topic: " + (err.response?.data?.message || err.message || err));
    }
  };

  const handleCreateGroup = async (payload) => {
    try {
      if (!selectedSemesterId || !selectedClassId) {
        alert("Please select a semester and class before creating a group.");
        return;
      }

      await groupService.create({
        semester_id: selectedSemesterId,
        class_id: selectedClassId,
        group_code: payload.group_code,
        group_name: payload.group_name,
        description: payload.description || "",
      });
      loadData();
    } catch (err) {
      alert("Failed to create group: " + (err.response?.data?.message || err.message || err));
      throw err;
    }
  };

  const handleFetchGroupData = async (groupId) => {
    if (fetchingGroupId != null) return;
    setFetchingGroupId(groupId);
    setFetchStatusByGroupId((prev) => ({
      ...prev,
      [groupId]: { type: "loading", text: "Fetching Jira/GitHub data..." },
    }));

    try {
      const [jiraResult, githubResult] = await Promise.all([
        syncService.syncJira({ groupId }),
        syncService.syncGithub({ groupId }),
      ]);

      const jiraOk = jiraResult?.ok !== false;
      const githubOk = githubResult?.ok !== false;
      if (!jiraOk || !githubOk) {
        const msg = jiraResult?.message || githubResult?.message || "Some sync operations failed.";
        throw new Error(msg);
      }

      const [jiraData] = await Promise.all([
        jiraTaskService.list().catch(() => []),
      ]);

      setJiraTasks(Array.isArray(jiraData) ? jiraData : []);
      setFetchStatusByGroupId((prev) => ({
        ...prev,
        [groupId]: { type: "success", text: "Data fetched successfully." },
      }));
    } catch (err) {
      setFetchStatusByGroupId((prev) => ({
        ...prev,
        [groupId]: {
          type: "error",
          text: err?.response?.data?.message || err?.message || "Fetch data failed.",
        },
      }));
    } finally {
      setFetchingGroupId(null);
    }
  };

  // Students available to add (not already in the target group AND must belong to the same class)
  const availableStudents = useMemo(() => {
    if (!addMemberGroupId) return [];
    const targetGroup = enrichedGroups.find((g) => g.id === addMemberGroupId);
    const groupClassId = targetGroup ? Number(targetGroup.class_id ?? targetGroup.classId) : null;
    const groupClass = allClasses.find((c) => Number(c.id) === Number(groupClassId));
    const isCapstoneGroup = String(groupClass?.class_type ?? groupClass?.classType ?? "MAIN").toUpperCase() === "CAPSTONE";
    const memberStudentIds = new Set(
      allMembers
        .filter((m) => Number(m.group_id ?? m.groupId) === Number(addMemberGroupId))
        .map((m) => Number(m.student_id ?? m.studentId)),
    );
    return students.filter((s) => {
      if (memberStudentIds.has(Number(s.id))) return false;
      // MAIN/10w groups use students.class_id. CAPSTONE/3w groups use capstone enrollment.
      if (groupClassId != null) {
        if (isCapstoneGroup) {
          const enrolledCapstoneClassId = Number(s.capstone_class_id ?? s.capstoneClassId);
          if (!enrolledCapstoneClassId || enrolledCapstoneClassId !== groupClassId) return false;
        } else {
          const studentClassId = Number(s.class_id ?? s.classId);
          if (!studentClassId || studentClassId !== groupClassId) return false;
        }
      }
      return true;
    });
  }, [addMemberGroupId, allMembers, students, enrichedGroups, allClasses]);

  const availableTopics = useMemo(
    () => topics.filter((t) => String(t.status || "").toUpperCase() !== "ARCHIVED"),
    [topics],
  );

  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);
  const isSemesterActive = selectedSemester?.status?.toLowerCase() === "active";

  return (
    <MyGroupsView
      enrichedGroups={enrichedGroups}
      expandedGroupId={expandedGroupId}
      onToggleExpand={toggleExpand}
      onRoleChange={handleRoleChange}
      onAddMember={handleAddMember}
      onRemoveMember={handleDropMember}
      addMemberGroupId={addMemberGroupId}
      onOpenAddMember={setAddMemberGroupId}
      onCloseAddMember={() => setAddMemberGroupId(null)}
      availableStudents={availableStudents}
      semesterOptions={semesters}
      classOptions={allClasses}
      selectedSemesterId={selectedSemesterId}
      selectedClassId={selectedClassId}
      onSemesterChange={(id) => {
        setSelectedSemesterId(id);
        setSelectedClassId(null);
      }}
      onClassChange={setSelectedClassId}
      topics={availableTopics}
      topicSelections={topicSelections}
      onTopicSelectionChange={handleTopicSelectionChange}
      onAssignTopic={handleAssignTopic}
      onCreateGroup={handleCreateGroup}
      onFetchGroupData={handleFetchGroupData}
      fetchingGroupId={fetchingGroupId}
      fetchStatusByGroupId={fetchStatusByGroupId}
      isSemesterActive={isSemesterActive}
    />
  );
}
