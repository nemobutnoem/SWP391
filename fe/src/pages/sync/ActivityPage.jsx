import React, { useEffect, useMemo, useState } from "react";
import { githubActivityService } from "../../services/githubActivities/githubActivity.service.js";
import { studentService } from "../../services/students/student.service.js";
import { ActivityView } from "./ActivityView.jsx";
import "./activity.css";

/**
 * Container layer  quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function ActivityPage() {
  const [allActivities, setAllActivities] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    githubActivityService.list().then(setAllActivities);
    studentService.list().then(setAllStudents);
  }, []);

  const [branchFilter, setBranchFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  const branches = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.ref_name || "main"))],
    [allActivities],
  );

  const actors = useMemo(
    () => ["all", ...new Set(allActivities.map((a) => a.github_username))],
    [allActivities],
  );

  const getStudentName = (githubUser) => {
    const s = allStudents.find((st) => st.github_username === githubUser);
    return s ? s.full_name : githubUser;
  };

  const filteredActivities = useMemo(() => {
    return allActivities.filter((a) => {
      const branchOk =
        branchFilter === "all" || (a.ref_name || "main") === branchFilter;
      const actorOk =
        actorFilter === "all" || a.github_username === actorFilter;
      return branchOk && actorOk;
    });
  }, [allActivities, branchFilter, actorFilter]);

  return (
    <ActivityView
      activities={filteredActivities}
      branches={branches}
      actors={actors}
      branchFilter={branchFilter}
      actorFilter={actorFilter}
      onBranchFilterChange={setBranchFilter}
      onActorFilterChange={setActorFilter}
      getStudentName={getStudentName}
    />
  );
}
