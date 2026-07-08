import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 by clearing storage and redirecting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getBoards = () => api.get('/boards');
export const createBoard = (data) => api.post('/boards', data);
export const getBoard = (roomId) => api.get(`/boards/${roomId}`);

// Phase 3: Role management
export const updateRole = (roomId, data) => api.put(`/boards/${roomId}/role`, data);
export const removeCollaborator = (roomId, userId) => api.delete(`/boards/${roomId}/collaborator/${userId}`);
export const getCollaborators = (roomId) => api.get(`/boards/${roomId}/collaborators`);

// Board management
export const deleteBoard = (roomId) => api.delete(`/boards/${roomId}`);

export default api;
