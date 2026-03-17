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

  const loadData = () => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    studentService.list().then(setStudents);
    gradeService.list().then(setGrades);
    topicService.list().then(setTopics);
    jiraTaskService.list().then(setJiraTasks).catch(() => setJiraTasks([]));
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
    return myGroups.map((g) => {
      const groupTasks = jiraTasks.filter((task) => Number(task.group_id ?? task.groupId) === Number(g.id));

      const scoredTasks = groupTasks.filter((task) => {
        const storyPoints = Number(task.story_points ?? task.storyPoints);
        const assigneeUserId = task.assigneeUserId ?? task.assignee_user_id;
        return Number.isFinite(storyPoints) && storyPoints > 0 && assigneeUserId;
      });

      const totalStoryPoints = scoredTasks.reduce(
        (sum, task) => sum + Number(task.story_points ?? task.storyPoints ?? 0),
        0,
      );

      const members = allMembers
        .filter((m) => m.group_id === g.id)
        .map((m) => {
          const student = students.find((s) => s.id === m.student_id);
          const memberUserId = student?.user_id ?? student?.userId;
          const memberStoryPoints = scoredTasks
            .filter((task) => Number(task.assigneeUserId ?? task.assignee_user_id) === Number(memberUserId))
            .reduce((sum, task) => sum + Number(task.story_points ?? task.storyPoints ?? 0), 0);

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
        (gr) => gr.group_id === g.id,
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
    try {
      const result = await syncService.syncJira({ groupId });
      if (result?.ok === false) {
        throw new Error(result?.message || "Jira refresh failed");
      }
      loadData();
      window.alert("Jira data refreshed successfully.");
    } catch (err) {
      alert("Failed to refresh Jira data: " + (err.response?.data?.message || err.message || err));
    }
  };

  // Students available to add (not already in the target group)
  const availableStudents = useMemo(() => {
    if (!addMemberGroupId) return [];
    const memberStudentIds = new Set(
      allMembers.filter((m) => m.group_id === addMemberGroupId).map((m) => m.student_id),
    );
    return students.filter((s) => !memberStudentIds.has(s.id));
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
    />
  );
}
