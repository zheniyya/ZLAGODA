import { useContext } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-wider text-center">ZLAGODA</h1>
          <p className="text-center text-sm text-gray-400 mt-1">
            {user?.role === 'manager' ? 'Панель Менеджера' : 'Каса'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {user?.role === 'manager' && (
            <>
              <Link to="/manager" className="block px-4 py-2 rounded hover:bg-slate-700 transition">🏠 Головна</Link>
              <Link to="/manager/employees" className="block px-4 py-2 rounded hover:bg-slate-700 transition">👥 Працівники</Link>
              <Link to="/manager/products" className="block px-4 py-2 rounded hover:bg-slate-700 transition">📦 Товари</Link>
              <Link to="/manager/checks" className="block px-4 py-2 rounded hover:bg-slate-700 transition">🧾 Всі чеки</Link>
              <Link to="/manager/customers" className="block px-4 py-2 rounded hover:bg-slate-700 transition">🛍️ Клієнти</Link>
              <Link to="/manager/reports" className="block px-4 py-2 rounded hover:bg-slate-700 transition">📊 Звіти</Link>
            </>
          )}
          
          {user?.role === 'cashier' && (
            <>
              <Link to="/cashier" className="block px-4 py-2 rounded hover:bg-slate-700 transition">🏠 Головна</Link>
              <Link to="/cashier/create-check" className="block px-4 py-2 rounded hover:bg-green-700 transition">🛒 Новий чек</Link>
              <Link to="/cashier/checks" className="block px-4 py-2 rounded hover:bg-slate-700 transition">🧾 Мої чеки</Link>
              <Link to="/cashier/customers" className="block px-4 py-2 rounded hover:bg-slate-700 transition">🛍️ Клієнти</Link>
              <Link to="/cashier/profile" className="block px-4 py-2 rounded hover:bg-slate-700 transition">👤 Профіль</Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
          >
            Вийти
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;