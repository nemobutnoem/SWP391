import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../../services/groups/group.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { LecturerDashboardView } from "./LecturerDashboardView.jsx";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 * Không chứa JSX UI trực tiếp.
 */
export function LecturerDashboardPage() {
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [githubActivities, setGithubActivities] = useState([]);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState({});

  useEffect(() => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    gradeService.list().then(setGrades);
    jiraTaskService.list().then(setJiraTasks).catch(() => setJiraTasks([]));
    githubActivityService.list().then(setGithubActivities).catch(() => setGithubActivities([]));
  }, []);

  const myGroups = allGroups;
  const myGrades = grades;
  const pendingCount = myGrades.filter((g) => g.status === "PENDING").length;

  const totalStudents = useMemo(() => {
    const ids = new Set(myGroups.map((g) => g.id));
    return allMembers.filter((m) => ids.has(m.group_id)).length;
  }, [myGroups, allMembers]);

  const enrichedGroups = useMemo(() => {
    return myGroups.map((g) => {
      const members = allMembers.filter((m) => m.group_id === g.id);
      const tasks = jiraTasks.filter((t) => t.group_id === g.id);
      const activities = githubActivities
        .filter((a) => a.group_id === g.id)
        .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
      const groupGrades = myGrades.filter((gr) => gr.group_id === g.id);

      const doneTasks = tasks.filter((t) => t.status === "Done" || t.status === "DONE").length;
      const totalTasks = tasks.length;
      const overdueTasks = tasks.filter((t) => {
        const due = t.dueDate || t.due_date;
        return due && daysLeft(due) < 0 && t.status !== "Done" && t.status !== "DONE";
      }).length;

      return {
        ...g,
        members,
        tasks,
        activities,
        groupGrades,
        doneTasks,
        totalTasks,
        overdueTasks,
        totalCommits: activities.reduce((s, a) => s + (a.pushed_commit_count || 1), 0),
      };
    });
  }, [myGroups, allMembers, jiraTasks, githubActivities, myGrades]);

  const totalTasks = jiraTasks.length;
  const completedTasks = jiraTasks.filter((t) => t.status === "Done" || t.status === "DONE").length;

  const handleToggleGroup = (id) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  const handleSetTab = (groupId, tab) => setActiveTab((prev) => ({ ...prev, [groupId]: tab }));

  return (
    <LecturerDashboardView
      enrichedGroups={enrichedGroups}
      totalStudents={totalStudents}
      pendingCount={pendingCount}
      totalTasks={totalTasks}
      completedTasks={completedTasks}
      expandedGroupId={expandedGroupId}
      activeTab={activeTab}
      onToggleGroup={handleToggleGroup}
      onSetTab={handleSetTab}
      onNavigateMyGroups={() => navigate("/classes")}
      onNavigateGrading={() => navigate("/grading")}
    />
  );
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}
