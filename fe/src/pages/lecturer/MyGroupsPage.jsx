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
    groupService.listMembers().then(setAllMembers);
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

          const memberStoryPoints = scoredTasks
            .filter(({ assigneeKeys }) => {
              for (const key of memberKeys) {
                if (assigneeKeys.has(key)) return true;
              }
              return false;
            })
            .reduce((sum, item) => sum + item.storyPoints, 0);

          return {
            ...student,
            ...m,
            member_id: m.id,
            member_story_points: memberStoryPoints,
            contribution_pct:
              totalStoryPoints > 0 && memberStoryPoints > 0
                ? Number(((memberStoryPoints / totalStoryPoints) * 100).toFixed(1))
                : null,
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

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await groupService.updateMemberRole(memberId, newRole);
      setAllMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role_in_group: newRole } : m)),
      );
    } catch (err) {
      alert("Failed to update role: " + (err.message || err));
    }
  };

  const handleAddMember = async (groupId, studentId, role) => {
    try {
      await groupService.addMember(groupId, studentId, role);
      loadData();
    } catch (err) {
      alert("Failed to add member: " + (err.response?.data?.message || err.message || err));
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await groupService.removeMember(groupId, memberId);
      loadData();
    } catch (err) {
      alert("Failed to remove member: " + (err.message || err));
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

  // Students available to add (not already in the target group)
  const availableStudents = useMemo(() => {
    if (!addMemberGroupId) return [];
    const memberStudentIds = new Set(
      allMembers
        .filter((m) => Number(m.group_id ?? m.groupId) === Number(addMemberGroupId))
        .map((m) => Number(m.student_id ?? m.studentId)),
    );
    return students.filter((s) => !memberStudentIds.has(Number(s.id)));
  }, [addMemberGroupId, allMembers, students]);

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
      onRemoveMember={handleRemoveMember}
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
