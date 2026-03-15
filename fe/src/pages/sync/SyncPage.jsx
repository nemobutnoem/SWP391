import React, { useEffect, useMemo, useState } from "react";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { githubRepositoryService } from "../../services/githubRepositories/githubRepository.service.js";
import { studentService } from "../../services/students/student.service.js";
import { syncService } from "../../services/sync/sync.service.js";
import { SyncView } from "./SyncView.jsx";
import "./sync.css";

/**
 * Container layer – Code Activities page.
 * Hiển thị danh sách commit từ GitHub, hỗ trợ lọc theo repo, branch, contributor.
 */
export function SyncPage() {
  const [allActivities, setAllActivities] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [repoFilter, setRepoFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      githubActivityService.list().catch(() => []),
      githubRepositoryService.list().catch(() => []),
      studentService.list().catch(() => []),
    ]).then(([activities, repos, students]) => {
      setAllActivities(
        [...activities].sort(
          (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)
        )
      );
      setGithubRepos(repos);
      setAllStudents(students);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Derived filter options
  const repos = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.repo_name).filter(Boolean))],
    [allActivities]
  );

  const branches = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.ref_name || "main"))],
    [allActivities]
  );

  const actors = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.github_username))],
    [allActivities]
  );

  const getStudentName = (githubUser) => {
    const s = allStudents.find((st) => st.github_username === githubUser);
    return s ? s.full_name : githubUser;
  };

  const filteredActivities = useMemo(() => {
    const filtered = allActivities.filter((a) => {
      const repoOk = repoFilter === "all" || a.repo_name === repoFilter;
      const branchOk =
        branchFilter === "all" || (a.ref_name || "main") === branchFilter;
      const actorOk =
        actorFilter === "all" || a.github_username === actorFilter;
      const searchOk =
        !searchQuery ||
        (a.commit_message || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (a.commit_sha || "").toLowerCase().includes(searchQuery.toLowerCase());
      return repoOk && branchOk && actorOk && searchOk;
    });

    // Deduplicate commits that appear on multiple branches.
    // Merge branch names into _branches array so UI can show all of them.
    const map = new Map();
    for (const a of filtered) {
      const key = a.commit_sha || a.id;
      if (map.has(key)) {
        const existing = map.get(key);
        const branch = a.ref_name || "main";
        if (!existing._branches.includes(branch)) {
          existing._branches.push(branch);
        }
      } else {
        map.set(key, { ...a, _branches: [a.ref_name || "main"] });
      }
    }
    return [...map.values()].sort(
      (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)
    );
  }, [allActivities, repoFilter, branchFilter, actorFilter, searchQuery]);

  // Stats – count unique commits by SHA, not raw records
  const stats = useMemo(() => {
    const uniqueCommits = new Set(allActivities.map((a) => a.commit_sha).filter(Boolean));
    const uniqueBranches = new Set(allActivities.map((a) => a.ref_name || "main"));
    const uniqueContributors = new Set(allActivities.map((a) => a.github_username));
    const today = new Date().toDateString();
    const todayShas = new Set(
      allActivities
        .filter((a) => new Date(a.occurred_at).toDateString() === today)
        .map((a) => a.commit_sha)
        .filter(Boolean)
    );
    return {
      totalCommits: uniqueCommits.size,
      activeBranches: uniqueBranches.size,
      contributors: uniqueContributors.size,
      todayCommits: todayShas.size,
    };
  }, [allActivities]);

  const handleFetchCommits = async () => {
    setSyncing(true);
    try {
      await syncService.syncGithub();
      loadData();
    } catch (e) {
      console.error("[CodeActivities] Fetch commits failed:", e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SyncView
      activities={filteredActivities}
      githubRepos={githubRepos}
      stats={stats}
      loading={loading}
      syncing={syncing}
      repos={repos}
      branches={branches}
      actors={actors}
      repoFilter={repoFilter}
      branchFilter={branchFilter}
      actorFilter={actorFilter}
      searchQuery={searchQuery}
      onRepoFilterChange={setRepoFilter}
      onBranchFilterChange={setBranchFilter}
      onActorFilterChange={setActorFilter}
      onSearchQueryChange={setSearchQuery}
      onFetchCommits={handleFetchCommits}
      getStudentName={getStudentName}
    />
  );
}
