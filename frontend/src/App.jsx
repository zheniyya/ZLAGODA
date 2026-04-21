import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/manager/Dashboard';
import Employees from './pages/manager/Employees';
import Products from './pages/manager/Products';
import Reports from './pages/manager/Reports';
import CashierDashboard from './pages/cashier/CashierDashboard';
import CreateCheck from './pages/cashier/CreateCheck';
import Profile from './pages/cashier/Profile';

import ChecksList from './pages/shared/ChecksList';
import Customers from './pages/shared/Customers';
import Stats from './pages/manager/Stats';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Роути Менеджера */}
          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route element={<Layout />}> 
              <Route path="/manager" element={<Dashboard />} />
              <Route path="/manager/employees" element={<Employees />} />
              <Route path="/manager/products" element={<Products />} />
              <Route path="/manager/reports" element={<Reports />} /> 
              <Route path="/manager/customers" element={<Customers />} />
              <Route path="/manager/checks" element={<ChecksList />} />
              <Route path="/manager/stats" element={<Stats />} />

            </Route>
          </Route>

          {/* Роути Касира */}
          <Route element={<ProtectedRoute allowedRoles={['cashier']} />}>
            <Route element={<Layout />}>
              <Route path="/cashier" element={<CashierDashboard />} />
              <Route path="/cashier/create-check" element={<CreateCheck />} />
              <Route path="/cashier/profile" element={<Profile />} />
              <Route path="/cashier/checks" element={<ChecksList />} />
              <Route path="/cashier/customers" element={<Customers />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;