import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getProfile: () => api.get('/auth/profile'),
  searchUsers: (query) => api.get(`/auth/search?query=${query}`),
  setToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  createChat: (participantIds, name, isGroupChat) => 
    api.post('/chats', { participantIds, name, isGroupChat }),
  getChatById: (chatId) => api.get(`/chats/${chatId}`),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
  leaveChat: (chatId) => api.post(`/chats/${chatId}/leave`)
};

export const messageAPI = {
  getMessages: (chatId, page = 1, limit = 50) => 
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
  sendMessage: (chatId, content, messageType = 'text') => 
    api.post(`/messages/${chatId}`, { content, messageType }),
  editMessage: (messageId, content) => 
    api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};

export default api;