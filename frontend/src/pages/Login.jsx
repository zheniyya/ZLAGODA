import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiService } from '../api/apiService';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { loginAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
     const response = await apiService.login(credentials);
     const token = response.access_token || response.token;
     if (token) {
     localStorage.setItem('token', token);
     }
     loginAuth(response.user);  // user.role вже 'manager' або 'cashier'
     if (response.user.role === 'manager') navigate('/manager');
     else navigate('/cashier');
    } catch (err) {
      setError(err.message || 'Помилка входу. Перевірте дані.');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96 flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-center mb-4">ZLAGODA</h1>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm text-center">{error}</div>}
        <input
          type="text"
          placeholder="ID Працівника"
          className="border p-2 rounded"
          value={credentials.username}
          onChange={e => setCredentials({...credentials, username: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          className="border p-2 rounded"
          value={credentials.password}
          onChange={e => setCredentials({...credentials, password: e.target.value})}
          required
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
          Увійти
        </button>
      </form>
    </div>
  );
};

export default Login;