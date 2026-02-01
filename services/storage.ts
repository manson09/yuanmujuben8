
import { Project } from '../types';

const STORAGE_KEY = 'AI_CREATIVE_AGENT_PROJECTS';

export const storage = {
  getProjects: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveProjects: (projects: Project[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },
  getProject: (id: string): Project | undefined => {
    const projects = storage.getProjects();
    return projects.find(p => p.id === id);
  },
  updateProject: (project: Project) => {
    const projects = storage.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = { ...project, updatedAt: Date.now() };
    } else {
      projects.push(project);
    }
    storage.saveProjects(projects);
  }
};
