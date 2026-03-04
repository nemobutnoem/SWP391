function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const syncMock = {
  async syncAll() {
    await sleep(900);
    return {
      ok: true,
      message: "Mock sync completed",
      synced: {
        jira: { issues: 12, sprints: 2 },
        github: { commits: 35, activities: 35 },
      },
      finishedAt: new Date().toISOString(),
    };
  },

  async syncJira() {
    await sleep(700);
    return { ok: true, message: "Mock Jira sync completed", finishedAt: new Date().toISOString() };
  },

  async syncGithub() {
    await sleep(700);
    return { ok: true, message: "Mock GitHub sync completed", finishedAt: new Date().toISOString() };
  },
};