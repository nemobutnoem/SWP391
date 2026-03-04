import { mockDb } from "./mock/mockDb.js";

/**
 * Data Access Layer (DAL)
 * Returns cloned copies of mock data to ensure immutability in the UI layers.
 */

export const getSession = () => structuredClone(mockDb.session);

export const getCourseOfferings = () => structuredClone(mockDb.courseOfferings);

export const getCourses = () => structuredClone(mockDb.courses);

export const getProjects = () => structuredClone(mockDb.projects);

export const getGroups = () => structuredClone(mockDb.groups);

export const getGroupMembers = () => structuredClone(mockDb.groupMembers);

export const getStudents = () => structuredClone(mockDb.students);

export const getJiraProjects = () => structuredClone(mockDb.jiraProjects);

export const getGithubRepositories = () =>
  structuredClone(mockDb.githubRepositories);

export const getJiraTasks = () => structuredClone(mockDb.jiraTasks);

export const getGithubActivities = () =>
  structuredClone(mockDb.githubActivities);

export const getSyncLogs = () => structuredClone(mockDb.syncLogs);

export const getTopics = () => structuredClone(mockDb.topics || []);

export const getLecturers = () => structuredClone(mockDb.lecturers || []);

export const getGrades = () => structuredClone(mockDb.grades || []);
