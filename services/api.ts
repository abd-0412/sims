
import axios from 'axios';

// When running locally with XAMPP and a Node server, 
// we point to the server's port (usually 5000 or 3000).
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('current_user');
      window.location.href = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
