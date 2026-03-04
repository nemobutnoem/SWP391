import React, { useEffect, useMemo, useState } from "react";
import { TasksBoardView } from "./TasksBoardView.jsx";
import { effectiveStatus } from "../../features/tasks/taskStats.js";

import { jiraTaskService } from "../../services/jiraTasks/jiraTask.service.js";
import { syncService } from "../../services/sync/sync.service.js";
import { groupService } from "../../services/groups/group.service.js";

function normalizeStatus(s) {
  const v = String(s ?? "").trim().toUpperCase();
  if (v === "TODO" || v === "TO DO" || v === "TO_DO") return "TODO";
  if (v === "IN_PROGRESS" || v === "IN PROGRESS" || v === "INPROGRESS")
    return "IN_PROGRESS";
  // UI does not have a separate Review lane; treat it as In Progress.
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
    // giữ raw nếu cần debug
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

  return {
    userId: userId == null ? null : Number(userId),
    name: String(name || "").trim(),
    jiraAccountId: m.jiraAccountId ?? m.jira_account_id ?? null,
  };
}

export function TasksBoardPage() {
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [membersByGroupId, setMembersByGroupId] = useState({});

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
              .filter((x) => x.userId != null && x.name);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    // optimistic UI: update trước cho mượt
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(taskId) ? { ...t, status: newStatus } : t)),
    );

    try {
      await jiraTaskService.updateStatus(taskId, newStatus);
      await load(); // reload để chắc chắn đồng bộ với mockDb/api
    } catch (e) {
      console.error("[TasksBoard] updateStatus failed:", e);
      await load(); // rollback bằng cách reload
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

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [query, tasks]);

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

  const onSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.syncAll();
      await load();
    } catch (e) {
      console.error("[TasksBoard] sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TasksBoardView
      query={query}
      onQueryChange={setQuery}
      isSyncing={isSyncing}
      onSync={onSync}
      columns={columns}
      onStatusChange={handleStatusChange}
      membersByGroupId={membersByGroupId}
      onAssigneeChange={handleAssigneeChange}
      onDueDateChange={handleDueDateChange}
      onPriorityChange={handlePriorityChange}
    />
  );
}