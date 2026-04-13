import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Якщо роль не підходить, кидаємо на їхню головну сторінку
    return <Navigate to={user.role === 'manager' ? '/manager' : '/cashier'} replace />;
  }

  return <Outlet />; // Рендеримо дочірні маршрути
};

export default ProtectedRoute;