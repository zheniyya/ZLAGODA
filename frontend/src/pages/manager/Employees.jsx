import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../api/apiService';
import debounce from 'lodash/debounce'; // потрібно встановити lodash або написати свою debounce-функцію

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ empl_surname: '', empl_name: '', empl_role: 'cashier', phone_number: '', salary: 0 });

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      const data = await apiService.getEmployees(params);
      setEmployees(data);
    } catch (error) {
      console.error('Помилка завантаження:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedLoad = useCallback(debounce(loadEmployees, 300), [loadEmployees]);

  useEffect(() => {
    debouncedLoad();
    return () => debouncedLoad.cancel();
  }, [searchQuery, roleFilter, debouncedLoad]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleRoleChange = (e) => setRoleFilter(e.target.value);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiService.updateEmployee(editingId, formData);
    } else {
      await apiService.createEmployee(formData);
    }
    setIsModalOpen(false);
    loadEmployees();
  };

  const openModal = (emp = null) => {
    if (emp) {
      setEditingId(emp.id_employee);
      setFormData(emp);
    } else {
      setEditingId(null);
      setFormData({ empl_surname: '', empl_name: '', empl_role: 'cashier', phone_number: '', salary: 0 });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Звільнити працівника?")) {
      await apiService.deleteEmployee(id);
      loadEmployees();
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Персонал (Менеджер)</h2>
        <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          + Додати працівника
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="🔍 Пошук за прізвищем..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-2 border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition text-lg"
        />
        <select
          value={roleFilter}
          onChange={handleRoleChange}
          className="flex-1 border-2 border-gray-200 p-3 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500"
        >
          <option value="">Всі посади</option>
          <option value="cashier">Касир</option>
          <option value="manager">Менеджер</option>
        </select>
      </div>

      {loading && <div className="text-center py-4">Завантаження...</div>}

      <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3">ID</th>
            <th className="p-3">Прізвище та Ім'я</th>
            <th className="p-3">Посада</th>
            <th className="p-3">Телефон</th>
            <th className="p-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id_employee} className="border-b hover:bg-gray-50">
              <td className="p-3 font-mono text-sm">{emp.id_employee}</td>
              <td className="p-3 font-semibold">{`${emp.empl_surname} ${emp.empl_name}`}</td>
              <td className="p-3">{emp.empl_role}</td>
              <td className="p-3">{emp.phone_number}</td>
              <td className="p-3 text-right space-x-2">
                <button onClick={() => openModal(emp)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Ред.</button>
                <button onClick={() => handleDelete(emp.id_employee)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Вид.</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модальне вікно (без змін) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Редагувати працівника' : 'Новий працівник'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Прізвище" className="w-full border p-3 rounded-lg" value={formData.empl_surname} onChange={e => setFormData({...formData, empl_surname: e.target.value})} />
              <input required placeholder="Ім'я" className="w-full border p-3 rounded-lg" value={formData.empl_name} onChange={e => setFormData({...formData, empl_name: e.target.value})} />
              <select className="w-full border p-3 rounded-lg" value={formData.empl_role} onChange={e => setFormData({...formData, empl_role: e.target.value})}>
                <option value="cashier">Касир</option>
                <option value="manager">Менеджер</option>
              </select>
              <input 
                type="tel" 
                required 
                placeholder="Телефон (+380XXXXXXXXX)" 
                className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-200" 
                value={formData.phone_number} 
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                pattern="^\+380\d{9}$" 
                maxLength="13"
                title="Номер телефону має починатися з +380 і містити рівно 13 символів (наприклад, +380501234567)"
              />
              <div className="flex justify-end space-x-2 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Скасувати</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;