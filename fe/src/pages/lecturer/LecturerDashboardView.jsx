import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { groupService } from "../../services/groups/group.service.js";
import { gradeService } from "../../services/grades/grade.service.js";
import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { studentService } from "../../services/students/student.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { StatCard } from "../../components/common/StatCard.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { GitHubInsights } from "../../components/github/GitHubInsights.jsx";
import { MemberWorkProgress } from "../dashboard/MemberWorkProgress.jsx";
import "../../pages/dashboard/dashboardPage.css";
import "./lecturer.css";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) return "upcoming";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function normalizeTaskStatus(status) {
  const value = String(status || "").trim().toUpperCase();
  if (value === "DONE") return "DONE";
  if (value === "IN_PROGRESS" || value === "IN PROGRESS") return "IN_PROGRESS";
  if (value === "IN_REVIEW" || value === "IN REVIEW") return "IN_PROGRESS";
  return "TODO";
}

export function LecturerDashboardView() {
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [githubActivities, setGithubActivities] = useState([]);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [collapsedBranches, setCollapsedBranches] = useState({});
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  useEffect(() => {
    groupService.list().then(setAllGroups);
    groupService.listMembers().then(setAllMembers);
    studentService.list().then(setStudents).catch(() => setStudents([]));
    gradeService.list().then(setGrades);
    jiraTaskService.list().then(setJiraTasks).catch(() => setJiraTasks([]));
    githubActivityService.list().then(setGithubActivities).catch(() => setGithubActivities([]));
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
    semesterService
      .getActive()
      .then((s) => {
        setActiveSemester(s);
        setSelectedSemesterId((prev) => prev ?? s?.id ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSemesterId && activeSemester?.id) {
      setSelectedSemesterId(activeSemester.id);
    }
  }, [activeSemester, selectedSemesterId]);

  useEffect(() => {
    const semId = selectedSemesterId || activeSemester?.id || null;
    classService
      .list(semId)
      .then((list) => {
        setClasses(list || []);
        setSelectedClassId((prev) => (prev && !list?.some((c) => c.id === prev) ? null : prev));
      })
      .catch(() => setClasses([]));
  }, [selectedSemesterId, activeSemester]);

  const semesterLabel =
    semesters.find((s) => s.id === selectedSemesterId)?.code ||
    activeSemester?.code ||
    "Current semester";

  const renderSemLabel = (sem) => {
    if (!sem) return "";
    const isActive = activeSemester && sem.id === activeSemester.id;
    if (isActive) return `${sem.code} (Active)`;

    const start = sem.start_date ?? sem.startDate ?? null;
    const end = sem.end_date ?? sem.endDate ?? null;
    const today = new Date();
    let tag = "Past";
    if (start && !isNaN(new Date(start).getTime()) && new Date(start) > today) {
      tag = "Upcoming";
    } else if (end && !isNaN(new Date(end).getTime()) && new Date(end) < today) {
      tag = "Past";
    } else if (start && end && new Date(start) <= today && today <= new Date(end)) {
      tag = "Active";
    }
    return `${sem.code} (${tag})`;
  };

  const myGroups = useMemo(() => {
    const filteredBySem = selectedSemesterId
      ? allGroups.filter((g) => (g.semester_id ?? g.semesterId) === selectedSemesterId)
      : allGroups;
    if (!selectedClassId) return filteredBySem;
    return filteredBySem.filter((g) => (g.class_id ?? g.classId) === selectedClassId);
  }, [allGroups, selectedSemesterId, selectedClassId]);

  const selectedGroupIds = useMemo(() => new Set(myGroups.map((g) => g.id)), [myGroups]);

  const myGrades = useMemo(
    () => grades.filter((g) => selectedGroupIds.has(g.group_id ?? g.groupId)),
    [grades, selectedGroupIds],
  );
  const pendingCount = myGrades.filter((g) => g.status === "PENDING").length;

  const totalStudents = useMemo(
    () => allMembers.filter((m) => selectedGroupIds.has(m.group_id)).length,
    [allMembers, selectedGroupIds],
  );

  const tasksForSelectedGroups = useMemo(
    () => jiraTasks.filter((t) => selectedGroupIds.has(t.group_id ?? t.groupId)),
    [jiraTasks, selectedGroupIds],
  );

  const loginLabelByUserId = useMemo(() => {
    return new Map(
      students.map((student) => [
        student.user_id ?? student.userId,
        student.email ? String(student.email).split("@")[0] : (student.student_code || student.full_name),
      ]),
    );
  }, [students]);

  const loginLabelByGithub = useMemo(() => {
    return new Map(
      students
        .filter((student) => student.github_username)
        .map((student) => [
          student.github_username,
          student.email ? String(student.email).split("@")[0] : (student.student_code || student.full_name),
        ]),
    );
  }, [students]);

  const enrichedGroups = useMemo(() => {
    return myGroups.map((g) => {
      const members = allMembers.filter((m) => m.group_id === g.id);
      const tasks = jiraTasks.filter((task) => Number(task.group_id ?? task.groupId) === Number(g.id));
      
      const toNumberOrNull = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      
      const normalizeText = (v) =>
        v == null ? "" : String(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim().toLowerCase();
        
      const getStoryPoints = (task) => Number(task.story_points ?? task.storyPoints ?? 0);
      
      const getTaskAssigneeKeys = (task) => {
        const keys = new Set();
        const assigneeUserId = toNumberOrNull(task.assigneeUserId ?? task.assignee_user_id);
        if (assigneeUserId != null && assigneeUserId > 0) keys.add(`uid:${assigneeUserId}`);
        const assigneeName = normalizeText(task.assigneeName ?? task.assignee_name);
        if (assigneeName) keys.add(`name:${assigneeName}`);
        return keys;
      };

      const scoredTasks = tasks
        .map((task) => ({
          task,
          storyPoints: getStoryPoints(task),
          assigneeKeys: getTaskAssigneeKeys(task),
        }))
        .filter(({ storyPoints, assigneeKeys }) => Number.isFinite(storyPoints) && storyPoints > 0 && assigneeKeys.size > 0);

      const totalStoryPoints = scoredTasks.reduce((sum, item) => sum + item.storyPoints, 0);

      const membersContributes = members.map(m => {
        const student = students.find((s) => Number(s.id) === Number(m.student_id ?? m.studentId));
        
        let name = student?.student_code || student?.studentCode || m.student_code;
        if (!name) name = student?.full_name || student?.fullName || m.full_name || m.fullName;
        if (!name) name = `User ${m.student_id}`;

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
        return { ...m, displayName: name, pct: pct.toFixed(1), sp: memberStoryPoints };
      }).sort((a,b) => parseFloat(b.pct) - parseFloat(a.pct));

      const rawActivities = githubActivities
        .filter((a) => a.group_id === g.id)
        .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

      const seenSha = new Set();
      const activities = rawActivities.filter((a) => {
        if (!a.commit_sha || seenSha.has(a.commit_sha)) return false;
        seenSha.add(a.commit_sha);
        return true;
      }).map((activity) => ({
        ...activity,
        displayName: loginLabelByGithub.get(activity.github_username) || activity.github_username,
      }));

      const activitiesByBranch = Object.entries(
        activities.reduce((acc, activity) => {
          const branch = activity.ref_name || "main";
          if (!acc[branch]) acc[branch] = [];
          acc[branch].push(activity);
          return acc;
        }, {}),
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([branch, branchActivities]) => ({
          branch,
          items: [...branchActivities].sort((a, b) => {
            const nameCompare = String(a.github_username || "").localeCompare(
              String(b.github_username || ""),
            );
            if (nameCompare !== 0) return nameCompare;
            return new Date(b.occurred_at) - new Date(a.occurred_at);
          }),
        }));

      const groupGrades = myGrades.filter((gr) => gr.group_id === g.id);
      const normalizedTasks = tasks.map((task) => ({
        ...task,
        displayAssignee:
          loginLabelByUserId.get(task.assigneeUserId ?? task.assignee_user_id) ||
          task.assigneeName ||
          "Unassigned",
      }));

      const doneTasks = normalizedTasks.filter((t) => normalizeTaskStatus(t.status) === "DONE").length;
      const inProgressTasks = normalizedTasks.filter(
        (t) => normalizeTaskStatus(t.status) === "IN_PROGRESS",
      ).length;
      const todoTasks = normalizedTasks.filter((t) => normalizeTaskStatus(t.status) === "TODO").length;
      const overdueTasks = normalizedTasks.filter((t) => {
        const due = t.dueDate || t.due_date;
        return due && daysLeft(due) < 0 && normalizeTaskStatus(t.status) !== "DONE";
      }).length;
      const totalTasks = normalizedTasks.length;
      const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      return {
        ...g,
        members,
        tasks: normalizedTasks,
        activities,
        activitiesByBranch,
        groupGrades,
        doneTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        totalTasks,
        progressPct,
        totalCommits: activities.length,
      };
    });
  }, [myGroups, allMembers, jiraTasks, githubActivities, myGrades, loginLabelByGithub, loginLabelByUserId]);

  const getTab = (groupId) => activeTab[groupId] || "tasks";
  const setTab = (groupId, tab) => setActiveTab((prev) => ({ ...prev, [groupId]: tab }));
  const toggleBranch = (groupId, branch) => {
    const key = `${groupId}::${branch}`;
    setCollapsedBranches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="dashboard-view">
      <PageHeader
        title="Lecturer Dashboard"
        description={`Semester: ${semesterLabel} • You supervise ${myGroups.length} group(s) with ${totalStudents} students. ${pendingCount} pending grade(s).`}
        actions={
          <div className="lecturer-header-actions">
            <select
              className="semester-select lecturer-filter-select"
              value={selectedSemesterId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedSemesterId(v === "" ? activeSemester?.id ?? null : Number(v));
              }}
            >
              {activeSemester && (
                <option value={activeSemester.id}>{renderSemLabel(activeSemester)}</option>
              )}
              {semesters
                .filter((s) => !activeSemester || s.id !== activeSemester.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {renderSemLabel(s)}
                  </option>
                ))}
              {!activeSemester && <option value="">All semesters</option>}
            </select>

            <select
              className="semester-select lecturer-filter-select"
              value={selectedClassId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedClassId(v === "" ? null : Number(v));
              }}
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_code || c.classCode || `Class #${c.id}`}
                </option>
              ))}
            </select>

            <Button variant="secondary" size="sm" onClick={() => navigate("/classes")}>
              My Groups
            </Button>
          </div>
        }
      />

      <div className="dashboard-view__grid">
        <StatCard title="Groups" value={myGroups.length} subtext="Supervised" icon="Groups" />
        <StatCard title="Students" value={totalStudents} subtext="Under guidance" icon="Students" />
        <StatCard
          title="Pending Grades"
          value={pendingCount}
          subtext={pendingCount > 0 ? "Action needed" : "All clear"}
          trend={pendingCount > 0 ? "warning" : "success"}
          icon="Grades"
        />
        <StatCard
          title="Total Tasks"
          value={tasksForSelectedGroups.length}
          subtext={`${tasksForSelectedGroups.filter((t) => normalizeTaskStatus(t.status) === "DONE").length} completed`}
          icon="Tasks"
        />
      </div>

      <div className="lecturer-groups-section">
        <h2 className="section-title" style={{ marginBottom: "1rem" }}>
          My Groups ({enrichedGroups.length})
        </h2>

        {enrichedGroups.length === 0 && (
          <div className="text-secondary" style={{ padding: "2rem", textAlign: "center" }}>
            No groups assigned to you yet.
          </div>
        )}

        {enrichedGroups.map((g) => {
          const isExpanded = expandedGroupId === g.id;
          const tab = getTab(g.id);

          return (
            <div key={g.id} className={`lecturer-group-card ${isExpanded ? "lecturer-group-card--expanded" : ""}`}>
              <div className="lecturer-group-header" onClick={() => setExpandedGroupId(isExpanded ? null : g.id)}>
                <div className="lecturer-group-info">
                  <div className="lecturer-group-avatar">
                    {g.group_name?.substring(0, 2).toUpperCase() || "G"}
                  </div>
                  <div className="lecturer-group-text-wrap">
                    <div className="lecturer-group-name">{g.group_name}</div>
                    <div className="lecturer-group-meta">
                      <span><strong>{g.members.length}</strong> members</span>
                      <span className="meta-dot">•</span>
                      <span><strong>{g.totalTasks}</strong> tasks</span>
                      <span className="meta-dot">•</span>
                      <span><strong>{g.totalCommits}</strong> commits</span>
                    </div>
                  </div>
                </div>
                <div className="lecturer-group-stats">
                  {g.overdueTasks > 0 && <Badge variant="danger" size="sm">{g.overdueTasks} overdue</Badge>}
                  <Badge variant={g.totalTasks > 0 && g.doneTasks === g.totalTasks ? "success" : "neutral"} size="sm">
                    {g.doneTasks}/{g.totalTasks} done
                  </Badge>
                  <span className={`lecturer-expand-arrow ${isExpanded ? "is-expanded" : ""}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="lecturer-group-detail">
                  <div className="lecturer-tabs">
                    <button className={`lecturer-tab ${tab === "tasks" ? "lecturer-tab--active" : ""}`} onClick={() => setTab(g.id, "tasks")}>
                      Jira Tasks ({g.tasks.length})
                    </button>
                    <button className={`lecturer-tab ${tab === "activity" ? "lecturer-tab--active" : ""}`} onClick={() => setTab(g.id, "activity")}>
                      GitHub Activity ({g.activities.length})
                    </button>
                    <button className={`lecturer-tab ${tab === "insights" ? "lecturer-tab--active" : ""}`} onClick={() => setTab(g.id, "insights")}>
                      Insights
                    </button>
                  </div>

                  {tab === "tasks" && (
                    <div className="lecturer-tab-content">
                      {g.tasks.length === 0 ? (
                        <div className="text-secondary" style={{ padding: "1rem" }}>
                          No Jira tasks synced yet. Sync from the Sync page.
                        </div>
                      ) : (
                        <>
                          <section className="lecturer-progress-panel">
                            <div className="lecturer-progress-panel__head">
                              <div>
                                <div className="lecturer-progress-panel__title">Jira Progress</div>
                                <div className="lecturer-progress-panel__subtitle">
                                  {g.doneTasks}/{g.totalTasks} tasks completed
                                </div>
                              </div>
                              <div className="lecturer-progress-panel__pct">{g.progressPct}%</div>
                            </div>

                            <div className="lecturer-progress-bar">
                              <div className="lecturer-progress-bar__fill" style={{ width: `${g.progressPct}%` }} />
                            </div>

                            <div className="lecturer-progress-grid">
                              <div className="lecturer-progress-stat">
                                <span className="lecturer-progress-stat__label">Done</span>
                                <strong>{g.doneTasks}</strong>
                              </div>
                              <div className="lecturer-progress-stat">
                                <span className="lecturer-progress-stat__label">In Progress</span>
                                <strong>{g.inProgressTasks}</strong>
                              </div>
                              <div className="lecturer-progress-stat">
                                <span className="lecturer-progress-stat__label">To Do</span>
                                <strong>{g.todoTasks}</strong>
                              </div>
                              <div className="lecturer-progress-stat lecturer-progress-stat--danger">
                                <span className="lecturer-progress-stat__label">Overdue</span>
                                <strong>{g.overdueTasks}</strong>
                              </div>
                            </div>
                          </section>

                          <section className="lecturer-member-progress">
                            <MemberWorkProgress
                              title="Team Member Progress"
                              showGitPanel={false}
                              tasks={g.tasks.map((t) => ({
                                ...t,
                                status: normalizeTaskStatus(t.status),
                                dueDate: t.dueDate || t.due_date || "",
                                assigneeName: t.displayAssignee || t.assigneeName || "Unassigned",
                              }))}
                              activities={g.activities}
                            />
                          </section>

                          <table className="lecturer-task-table">
                            <thead>
                              <tr>
                                <th>Key</th>
                                <th>Task</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Due</th>
                                <th>Assignee</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.tasks.map((t) => {
                                const due = t.dueDate || t.due_date;
                                const dl = daysLeft(due);
                                return (
                                  <tr key={t.id}>
                                    <td><code>{t.jira_issue_key}</code></td>
                                    <td>{t.title || t.summary}</td>
                                    <td>
                                      <Badge
                                        variant={
                                          normalizeTaskStatus(t.status) === "DONE"
                                            ? "success"
                                            : normalizeTaskStatus(t.status) === "IN_PROGRESS"
                                              ? "warning"
                                              : "info"
                                        }
                                        size="sm"
                                      >
                                        {t.status}
                                      </Badge>
                                    </td>
                                    <td>{t.priority || "-"}</td>
                                    <td>
                                      {due ? (
                                        <span style={{ color: dl !== null && dl < 0 ? "var(--danger-500)" : dl !== null && dl <= 3 ? "var(--warning-500)" : "inherit" }}>
                                          {due} {dl !== null && dl < 0 ? "!" : ""}
                                        </span>
                                      ) : "-"}
                                    </td>
                                    <td>{t.displayAssignee || t.assigneeName || "Unassigned"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </>
                      )}
                    </div>
                  )}

                  {tab === "activity" && (
                    <div className="lecturer-tab-content">
                      {g.activities.length === 0 ? (
                        <div className="text-secondary" style={{ padding: "1rem" }}>
                          No GitHub activity yet. Sync from the Sync page.
                        </div>
                      ) : (
                        <>
                          <section className="lecturer-member-progress">
                            <MemberWorkProgress
                              title="Git Contributors"
                              showJiraPanel={false}
                              activities={g.activities.map((a) => ({
                                ...a,
                                github_username: a.displayName || a.github_username,
                              }))}
                            />
                          </section>

                          <div className="lecturer-branch-groups">
                            {g.activitiesByBranch.map((branchGroup) => {
                              const branchKey = `${g.id}::${branchGroup.branch}`;
                              const isCollapsed = Boolean(collapsedBranches[branchKey]);

                              return (
                                <section
                                  key={branchGroup.branch}
                                  className={`lecturer-branch-group ${isCollapsed ? "lecturer-branch-group--collapsed" : ""}`}
                                >
                                  <button
                                    type="button"
                                    className="lecturer-branch-group__header lecturer-branch-group__toggle"
                                    onClick={() => toggleBranch(g.id, branchGroup.branch)}
                                    aria-expanded={!isCollapsed}
                                  >
                                    <div className="lecturer-branch-group__title-wrap">
                                      <div className="lecturer-branch-group__title">
                                        Branch: <code>{branchGroup.branch}</code>
                                      </div>
                                      <div className="lecturer-branch-group__subtitle">
                                        Sorted by member name inside this branch
                                      </div>
                                    </div>

                                    <div className="lecturer-branch-group__meta">
                                      <Badge variant="info" size="sm">
                                        {branchGroup.items.length} commit{branchGroup.items.length !== 1 ? "s" : ""}
                                      </Badge>
                                      <span
                                        className={`lecturer-branch-group__chevron ${isCollapsed ? "is-collapsed" : ""}`}
                                      >
                                        v
                                      </span>
                                    </div>
                                  </button>

                                  {!isCollapsed && (
                                    <div className="activity-feed lecturer-branch-group__content">
                                      {branchGroup.items.map((a) => (
                                        <div key={a.id} className="feed-item">
                                          <div className="feed-icon" style={{ background: "var(--brand-500)18", color: "var(--brand-500)" }}>↑</div>
                                          <div className="feed-content">
                                            <div className="feed-text">
                                              <strong>{a.displayName || a.github_username}</strong> {a.commit_message || `pushed ${a.pushed_commit_count || 0} commit(s)`}
                                            </div>
                                            <div className="feed-meta">
                                              <span className="feed-time">{timeAgo(a.occurred_at)}</span>
                                              {a.pushed_commit_count > 1 && (
                                                <Badge variant="info" size="sm">{a.pushed_commit_count} commits</Badge>
                                              )}
                                              {a.commit_sha && <code className="lecturer-commit-sha">{a.commit_sha.slice(0, 7)}</code>}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </section>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {tab === "insights" && (
                    <div className="lecturer-tab-content">
                      <GitHubInsights activities={g.activities} weeks={12} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
