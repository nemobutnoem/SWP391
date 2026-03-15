import React, { useEffect, useState, useMemo } from "react";
import { groupService } from "../../services/groups/group.service.js";
import { topicService } from "../../services/topics/topic.service.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { studentService } from "../../services/students/student.service.js";
import { classService } from "../../services/classes/class.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { AllocationView } from "./AllocationView.jsx";
import "./adminManagement.css";

/**
 * Container layer - quan ly state, goi service, truyen data + handler xuong View.
 * Khong chua JSX UI truc tiep.
 */
export function AllocationPage() {
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [groups, setGroups] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [members, setMembers] = useState([]);
  const [students, setStudents] = useState([]);

  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  useEffect(() => {
    semesterService.list().then(data => {
      setSemesters(data);
      const active = data.find(s => s.status.toLowerCase() === "active" || s.status.toLowerCase() === "upcoming");
      if (active) setSelectedSemesterId(active.id);
      else if (data.length > 0) setSelectedSemesterId(data[0].id);
    });
    groupService.list().then(setGroups);
    groupService.listMembers().then(setMembers);
    topicService.list().then(setTopics);
    lecturerService.list().then(setLecturers);
    studentService.list().then(setStudents);
  }, []);

  useEffect(() => {
    if (selectedSemesterId) {
      classService.list(selectedSemesterId).then((data) => {
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
        } else {
          setSelectedClassId("");
        }
      });
    } else {
      setClasses([]);
      setSelectedClassId("");
    }
  }, [selectedSemesterId]);

  const enrichedGroups = useMemo(() => {
    let filteredGroups = groups;
    if (selectedSemesterId) {
      filteredGroups = filteredGroups.filter(g => g.semester_id === Number(selectedSemesterId));
    }
    if (selectedClassId) {
      filteredGroups = filteredGroups.filter(g => g.class_id === Number(selectedClassId));
    }

    return filteredGroups.map((g) => {
      const groupMembers = members
        .filter((m) => m.group_id === g.id)
        .map((m) => {
          const student = students.find((s) => s.id === m.student_id);
          return { ...m, ...student };
        });

      const topic = topics.find((t) => t.id === g.project_id);
      const cls = classes.find((c) => c.id === g.class_id);
      const classLecturer = cls?.lecturer_id ? lecturers.find((l) => l.id === cls.lecturer_id) : null;

      return {
        ...g,
        members: groupMembers,
        topic_name: topic?.name || "Unassigned",
        class_lecturer_name: classLecturer?.full_name || null,
      };
    });
  }, [groups, members, students, topics, classes, lecturers, selectedSemesterId, selectedClassId]);

  const toggleExpand = (id) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  const handleAllocationChange = (groupId, field, value) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, [field]: value ? Number(value) : null } : g))
    );
  };

  const handleConfirmAllocation = async (group) => {
    try {
      if (group.project_id !== undefined) {
        await groupService.assignTopicAdmin(group.id, group.project_id);
      }
      alert(`Successfully allocated Topic for group: ${group.group_name}`);
    } catch (e) {
      alert("Failed to allocate: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <AllocationView
      semesters={semesters}
      classes={classes}
      selectedSemesterId={selectedSemesterId}
      selectedClassId={selectedClassId}
      onSemesterChange={(val) => setSelectedSemesterId(val)}
      onClassChange={(val) => setSelectedClassId(val)}
      enrichedGroups={enrichedGroups}
      topics={topics}
      expandedGroupId={expandedGroupId}
      onToggleExpand={toggleExpand}
      onAllocationChange={handleAllocationChange}
      onConfirmAllocation={handleConfirmAllocation}
    />
  );
}
