import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api', 
});

// Додаємо "перехоплювач" запитів
axiosClient.interceptors.request.use((config) => {
  // Дістаємо токен з localStorage (переконайтеся, що ви його туди зберігаєте при логіні)
  const token = localStorage.getItem('token'); 
  
  if (token) {
    // Додаємо токен у форматі Bearer
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;