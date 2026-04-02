import React, { useEffect, useMemo, useState, useCallback } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";
import { TaskDetailModal } from "./TaskDetailModal.jsx";
import { effectiveStatus } from "../../features/tasks/taskStats.js";

import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { syncService } from "../../services/sync/sync.service.js";
import { groupService } from "../../services/groups/group.service.js";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";

function normalizeStatus(s) {
  const v = String(s ?? "").trim().toUpperCase();
  if (v === "TODO" || v === "TO DO" || v === "TO_DO") return "TODO";
  if (v === "IN_PROGRESS" || v === "IN PROGRESS" || v === "INPROGRESS")
    return "IN_PROGRESS";
  if (v === "IN_REVIEW" || v === "IN REVIEW" || v === "INREVIEW")
    return "IN_PROGRESS";
  if (v === "DONE") return "DONE";
  return "TODO";
}

function normalizeJiraTask(t) {
  return {
    id: Number(t.id),
    groupId: Number(t.groupId ?? t.group_id ?? 0),
    title: t.title ?? t.summary ?? t.jira_issue_key ?? `Task #${t.id}`,
    dueDate: t.dueDate ?? t.due_date ?? "",
    priority: t.priority ?? "",
    assigneeName: t.assigneeName ?? t.assignee_name ?? t.assignee ?? "Unassigned",
    assigneeUserId: t.assigneeUserId ?? t.assignee_user_id ?? null,
    status: normalizeStatus(t.status),
    _raw: t,
  };
}

function normalizeMemberOption(m) {
  const student = m.student ?? m.studentEntity ?? null;
  const userId =
    m.userId ??
    m.user_id ??
    student?.userId ??
    student?.user_id ??
    null;
  const name =
    m.fullName ??
    m.full_name ??
    student?.fullName ??
    student?.full_name ??
    m.account ??
    (userId ? `User ${userId}` : "");
  const email =
    m.email ??
    student?.email ??
    null;
  const account = m.account ?? student?.account ?? null;
  const studentCode = m.studentCode ?? m.student_code ?? student?.student_code ?? student?.studentCode ?? null;
  const emailLocal = email && String(email).includes("@") ? String(email).split("@")[0].trim() : null;
  const lookupKeys = [name, account, emailLocal, studentCode]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  return {
    userId: userId == null ? null : Number(userId),
    name: String(name || "").trim(),
    jiraAccountId: m.jiraAccountId ?? m.jira_account_id ?? null,
    roleInGroup: m.roleInGroup ?? m.role_in_group ?? null,
    email: email ? String(email).trim() : null,
    emailLocal,
    account: account ? String(account).trim() : null,
    studentCode: studentCode ? String(studentCode).trim() : null,
    lookupKeys: Array.from(new Set(lookupKeys)),
  };
}

export function TasksBoardPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [membersByGroupId, setMembersByGroupId] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const isTeamLead = user?.role === ROLES.TEAM_LEAD;

  const canEditTaskFields = useMemo(() => {
    if (user?.role !== ROLES.TEAM_MEMBER) return true;
    const userId = Number(user?.id);
    if (!Number.isFinite(userId)) return false;

    const visibleGroupIds = new Set(
      tasks.map((t) => Number(t.groupId)).filter((gid) => Number.isFinite(gid) && gid > 0),
    );

    for (const gid of visibleGroupIds) {
      const me = (membersByGroupId[gid] || []).find((m) => Number(m.userId) === userId);
      if (String(me?.roleInGroup || "").trim().toUpperCase() === "LEADER") {
        return true;
      }
    }

    return false;
  }, [membersByGroupId, tasks, user?.id, user?.role]);

  const load = async () => {
    const data = await jiraTaskService.list();
    const list = Array.isArray(data) ? data : [];

    const normalized = list.map(normalizeJiraTask);
    setTasks(normalized);

    const groupIds = Array.from(
      new Set(normalized.map((t) => Number(t.groupId)).filter((gid) => gid > 0)),
    );

    if (groupIds.length > 0) {
      const results = await Promise.all(
        groupIds.map(async (gid) => {
          try {
            const members = await groupService.listGroupMembers(gid);
            const options = (Array.isArray(members) ? members : [])
              .map(normalizeMemberOption)
              .filter(
                (x) =>
                  x.userId != null &&
                  x.name &&
                  (!x.email || x.email.toLowerCase().endsWith("@fpt.edu.vn")),
              );
            return [gid, options];
          } catch (e) {
            console.warn("[TasksBoard] load members failed for group", gid, e);
            return [gid, []];
          }
        }),
      );

      setMembersByGroupId((prev) => {
        const next = { ...prev };
        for (const [gid, options] of results) {
          next[gid] = options;
        }
        return next;
      });
    }
  };

  useEffect(() => {
    load().catch((e) => console.error("[TasksBoard] load failed:", e));
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(taskId) ? { ...t, status: newStatus } : t)),
    );

    try {
      await jiraTaskService.updateStatus(taskId, newStatus);
      await load();
    } catch (e) {
      console.error("[TasksBoard] updateStatus failed:", e);
      await load();
    }
  };

  const handleAssigneeChange = async (taskId, groupId, newAssigneeUserId) => {
    const gid = Number(groupId);
    const uid = newAssigneeUserId == null ? null : Number(newAssigneeUserId);
    const options = membersByGroupId[gid] ?? [];
    const name = uid
      ? options.find((m) => Number(m.userId) === uid)?.name || `User ${uid}`
      : "Unassigned";

    setTasks((prev) =>
      prev.map((t) =>
        Number(t.id) === Number(taskId)
          ? { ...t, assigneeUserId: uid, assigneeName: name }
          : t,
      ),
    );

    try {
      await jiraTaskService.updateAssignee(taskId, uid);
      await load();
    } catch (e) {
      console.error("[TasksBoard] updateAssignee failed:", e);
      const msg = e?.message || "Update assignee failed";
      window.alert(msg);
      await load();
    }
  };

  const handleDueDateChange = async (taskId, newDueDate) => {
    const v = newDueDate == null ? "" : String(newDueDate);
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(taskId) ? { ...t, dueDate: v } : t)),
    );
    try {
      await jiraTaskService.updateFields(taskId, { dueDate: v });
      await load();
    } catch (e) {
      console.error("[TasksBoard] update dueDate failed:", e);
      await load();
    }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    const v = newPriority == null ? "" : String(newPriority);
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(taskId) ? { ...t, priority: v } : t)),
    );
    try {
      await jiraTaskService.updateFields(taskId, { priority: v });
      await load();
    } catch (e) {
      console.error("[TasksBoard] update priority failed:", e);
      await load();
    }
  };

  const assigneeFilterOptions = useMemo(() => {
    const deduped = new Map();

    Object.values(membersByGroupId).forEach((groupMembers) => {
      (groupMembers || []).forEach((member) => {
        if (member?.userId == null || !member?.name) return;
        const key = String(member.userId);
        if (!deduped.has(key)) deduped.set(key, member);
      });
    });

    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [membersByGroupId]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const normalizedUserId =
      user?.id == null || user.id === "" || Number.isNaN(Number(user.id)) ? null : Number(user.id);
    const normalizedUserName = String(user?.name || "")
      .trim()
      .toLowerCase();
    const selectedAssignee =
      selectedAssigneeUserId === "" || Number.isNaN(Number(selectedAssigneeUserId))
        ? null
        : assigneeFilterOptions.find((member) => Number(member.userId) === Number(selectedAssigneeUserId)) || null;

    return tasks.filter((t) => {
      const matchesQuery = !q || (t.title || "").toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (selectedAssignee) {
        const taskAssigneeId =
          t.assigneeUserId == null || t.assigneeUserId === "" || Number.isNaN(Number(t.assigneeUserId))
            ? null
            : Number(t.assigneeUserId);
        const taskAssigneeName = String(t.assigneeName || "")
          .trim()
          .toLowerCase();

        const matchesSelectedAssignee =
          (taskAssigneeId != null && taskAssigneeId === Number(selectedAssignee.userId)) ||
          selectedAssignee.lookupKeys.includes(taskAssigneeName);
        if (!matchesSelectedAssignee) return false;
      }
      if (!showOnlyMine) return true;

      const taskAssigneeId =
        t.assigneeUserId == null || t.assigneeUserId === "" || Number.isNaN(Number(t.assigneeUserId))
          ? null
          : Number(t.assigneeUserId);
      const taskAssigneeName = String(t.assigneeName || "")
        .trim()
        .toLowerCase();

      if (normalizedUserId != null && taskAssigneeId != null) {
        return taskAssigneeId === normalizedUserId;
      }
      return Boolean(normalizedUserName) && taskAssigneeName === normalizedUserName;
    });
  }, [assigneeFilterOptions, query, selectedAssigneeUserId, showOnlyMine, tasks, user]);

  const columns = useMemo(() => {
    const base = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      OVERDUE: [],
    };

    for (const t of filteredTasks) {
      const st = effectiveStatus(t);
      (base[st] ?? base.TODO).push(t);
    }
    return base;
  }, [filteredTasks]);

  const onSyncJira = async () => {
    setIsSyncing(true);
    try {
      await syncService.syncJira();
      await load();
    } catch (e) {
      console.error("[TasksBoard] sync Jira failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTaskClick = useCallback(async (task) => {
    setSelectedTask(task);
    setComments([]);
    setIsLoadingComments(true);
    try {
      const data = await jiraTaskService.listComments(task.id);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[TasksBoard] load comments failed:", e);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const handleAddComment = useCallback(async (taskId, content) => {
    const saved = await jiraTaskService.addComment(taskId, content);
    setComments((prev) => [saved, ...prev]);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedTask(null);
    setComments([]);
  }, []);

  const liveSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find((t) => Number(t.id) === Number(selectedTask.id)) || selectedTask;
  }, [selectedTask, tasks]);

  return (
    <>
      <TasksBoardView
        query={query}
        onQueryChange={setQuery}
        showAssigneeFilter={isTeamLead}
        assigneeFilterOptions={assigneeFilterOptions}
        selectedAssigneeUserId={selectedAssigneeUserId}
        onSelectedAssigneeChange={setSelectedAssigneeUserId}
        showOnlyMine={showOnlyMine}
        onToggleShowOnlyMine={() => setShowOnlyMine((prev) => !prev)}
        isSyncing={isSyncing}
        onSyncJira={onSyncJira}
        columns={columns}
        canEditTaskFields={canEditTaskFields}
        onStatusChange={handleStatusChange}
        membersByGroupId={membersByGroupId}
        onAssigneeChange={handleAssigneeChange}
        onDueDateChange={handleDueDateChange}
        onPriorityChange={handlePriorityChange}
        onTaskClick={handleTaskClick}
      />
      <TaskDetailModal
        isOpen={!!liveSelectedTask}
        onClose={handleCloseDetail}
        task={liveSelectedTask}
        comments={comments}
        onAddComment={handleAddComment}
        isLoadingComments={isLoadingComments}
        assigneeOptions={membersByGroupId?.[liveSelectedTask?.groupId] ?? []}
        canEditTaskFields={canEditTaskFields}
        onStatusChange={handleStatusChange}
        onAssigneeChange={handleAssigneeChange}
        onDueDateChange={handleDueDateChange}
        onPriorityChange={handlePriorityChange}
      />
    </>
  );
}

