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
  const [refreshingGroupId, setRefreshingGroupId] = useState(null);
  const [refreshStatusByGroupId, setRefreshStatusByGroupId] = useState({});

  const DROPPED_MEMBERS_STORAGE_KEY = "swp391:lecturer:droppedMembersByGroup";
  const loadDroppedMembersByGroup = () => {
    try {
      const raw = localStorage.getItem(DROPPED_MEMBERS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };
  const saveDroppedMembersByGroup = (value) => {
    try {
      localStorage.setItem(DROPPED_MEMBERS_STORAGE_KEY, JSON.stringify(value || {}));
    } catch {
      // ignore
    }
  };

  const loadJiraTasks = async () => {
    try {
      const list = await jiraTaskService.list();
      setJiraTasks(Array.isArray(list) ? list : []);
    } catch {
      setJiraTasks([]);
    }
  };

  const loadData = () => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then((members) => {
      const droppedByGroup = loadDroppedMembersByGroup();
      const next = (Array.isArray(members) ? members : []).map((m) => {
        const gid = Number(m.group_id ?? m.groupId);
        const mid = Number(m.id ?? m.member_id ?? m.memberId);
        const droppedList = droppedByGroup?.[String(gid)];
        const isDropped = Array.isArray(droppedList) && droppedList.map(Number).includes(mid);
        return isDropped ? { ...m, isDropped: true } : m;
      });
      setAllMembers(next);
    });
    studentService.list().then(setStudents);
    gradeService.list().then(setGrades);
    topicService.list().then(setTopics);
    loadJiraTasks();
    semesterService.list().then((data) => {
      setSemesters(data);
      const active = data.find((s) => s.status?.toLowerCase() === "active");
      if (active) setSelectedSemesterId(active.id);
    });
    classService.list().then(setAllClasses);
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

  // Đánh rớt sinh viên: chỉ set isDropped=true, không xóa khỏi danh sách
  const handleDropMember = async (groupId, memberId) => {
    if (!window.confirm("Bạn có chắc muốn đánh rớt sinh viên này không?")) return;
    try {
      // Persist to localStorage so reload vẫn giữ trạng thái.
      const gid = Number(groupId);
      const mid = Number(memberId);
      const droppedByGroup = loadDroppedMembersByGroup();
      const key = String(gid);
      const prevList = Array.isArray(droppedByGroup[key]) ? droppedByGroup[key] : [];
      const nextList = Array.from(new Set([...prevList.map(Number), mid]));
      saveDroppedMembersByGroup({ ...droppedByGroup, [key]: nextList });

      setAllMembers((prev) => prev.map((m) =>
        Number(m.group_id ?? m.groupId) === Number(groupId) && Number(m.id ?? m.member_id ?? m.memberId) === Number(memberId)
          ? { ...m, isDropped: true }
          : m
      ));
    } catch (err) {
      alert("Đánh rớt thất bại: " + (err.message || err));
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

  const handleRefreshGroupJira = async (groupId) => {
    if (refreshingGroupId != null) return;
    setRefreshingGroupId(groupId);
    setRefreshStatusByGroupId((prev) => ({
      ...prev,
      [groupId]: { type: "loading", text: "Refreshing Jira data..." },
    }));

    try {
      const result = await syncService.syncJira({ groupId });
      if (result?.ok === false) {
        throw new Error(result?.message || "Jira refresh failed");
      }
      await loadJiraTasks();
      setRefreshStatusByGroupId((prev) => ({
        ...prev,
        [groupId]: { type: "success", text: "Jira data updated." },
      }));
    } catch (err) {
      setRefreshStatusByGroupId((prev) => ({
        ...prev,
        [groupId]: {
          type: "error",
          text: err?.response?.data?.message || err?.message || "Failed to refresh Jira data.",
        },
      }));
    } finally {
      setRefreshingGroupId(null);
    }
  };

  // Students available to add (not already in the target group AND must belong to the same class)
  const availableStudents = useMemo(() => {
    if (!addMemberGroupId) return [];
    const targetGroup = enrichedGroups.find((g) => g.id === addMemberGroupId);
    const groupClassId = targetGroup ? Number(targetGroup.class_id ?? targetGroup.classId) : null;
    const memberStudentIds = new Set(
      allMembers
        .filter((m) => Number(m.group_id ?? m.groupId) === Number(addMemberGroupId))
        .map((m) => Number(m.student_id ?? m.studentId)),
    );
    return students.filter((s) => {
      if (memberStudentIds.has(Number(s.id))) return false;
      // Only show students that belong to the same class as the group
      if (groupClassId != null) {
        const studentClassId = Number(s.class_id ?? s.classId);
        if (!studentClassId || studentClassId !== groupClassId) return false;
      }
      return true;
    });
  }, [addMemberGroupId, allMembers, students, enrichedGroups]);

  const availableTopics = useMemo(
    () => topics.filter((t) => String(t.status || "").toUpperCase() !== "ARCHIVED"),
    [topics],
  );

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
      onRefreshGroupJira={handleRefreshGroupJira}
      refreshingGroupId={refreshingGroupId}
      refreshStatusByGroupId={refreshStatusByGroupId}
    />
  );
}
