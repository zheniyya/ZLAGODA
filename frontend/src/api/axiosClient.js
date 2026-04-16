import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',   // Відносний шлях – буде перенаправлено через проксі
});

// Перехоплювач для додавання токена
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;