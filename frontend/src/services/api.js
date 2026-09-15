import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const api = {
  predict: (profile) => axios.post(`${BASE}/predict-career`, profile).then(r => r.data),
  pathway: (profile, target_role) => axios.post(`${BASE}/career-pathway`, { profile, target_role }).then(r => r.data),
  chat: (question, top_k = 3) => axios.post(`${BASE}/chat`, { question, top_k }).then(r => r.data),
  careers: () => axios.get(`${BASE}/careers`).then(r => r.data),
  career: (name) => axios.get(`${BASE}/career/${encodeURIComponent(name)}`).then(r => r.data),
  certifications: () => axios.get(`${BASE}/certifications`).then(r => r.data),
  health: () => axios.get(`${BASE}/health`).then(r => r.data),
};
export const SKILLS = ['Python','Java','C++','JavaScript','SQL','Statistics','Machine Learning','Cloud','Web Development','Data Analysis','Cybersecurity','Communication','Problem Solving'];
export const INTERESTS = ['AI','Data','Web','Cloud','Security','Embedded'];
export const EDU = ["High School","Diploma","Bachelor's","Master's","PhD"];
export const EXP = ['Fresher','Intermediate','Experienced'];
export const DOMAINS = ['AI','Data','Web','Cloud','Security','Embedded','General'];
export const SUGGESTED_QUESTIONS = [
  'What skills do I need for ML Engineer?',
  'Which career matches Python and SQL?',
  'What should I learn first for Data Science?',
  'What projects should I build for Full Stack Developer?',
];
