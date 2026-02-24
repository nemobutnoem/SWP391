export const MOCK_TASKS = [
  { id: "1", title: "Task 1", dueDate: "2026-02-15", assigneeName: "John Smith", status: "TODO" },
  { id: "2", title: "Task 2", dueDate: "2026-02-18", assigneeName: "Emma Wilson", status: "TODO" },
  { id: "3", title: "Task 3", dueDate: "2026-02-22", assigneeName: "Mike Davis", status: "TODO" },
  { id: "4", title: "Task 4", dueDate: "2026-02-25", assigneeName: "Lisa Brown", status: "TODO" },

  { id: "5", title: "Task 5", dueDate: "2026-02-20", assigneeName: "Alex Chen", status: "IN_PROGRESS" },
  { id: "6", title: "Task 6", dueDate: "2026-02-23", assigneeName: "Anna Taylor", status: "IN_PROGRESS" },
  { id: "7", title: "Task 7", dueDate: "2026-02-27", assigneeName: "David Lee", status: "IN_PROGRESS" },

  { id: "8", title: "Task 8", dueDate: "2026-02-16", assigneeName: "Tom Miller", status: "IN_REVIEW" },
  { id: "9", title: "Task 9", dueDate: "2026-02-24", assigneeName: "Sarah Johnson", status: "IN_REVIEW" },

  { id: "10", title: "Task 10", dueDate: "2026-02-12", assigneeName: "John Smith", status: "DONE" },

  // quá hạn (so với 2026-02-24) và chưa DONE => sẽ ra OVERDUE
  { id: "11", title: "Task 11", dueDate: "2026-02-01", assigneeName: "Emma Wilson", status: "TODO" },
];