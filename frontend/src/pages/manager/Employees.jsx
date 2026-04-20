import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../api/apiService';
import debounce from 'lodash/debounce';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // New state to show the success window with the auto-generated password
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);

  const emptyForm = {
    id_employee: '',
    empl_surname: '',
    empl_name: '',
    empl_role: 'Cashier',
    salary: 0,
    date_of_birth: '',
    date_of_start: '',
    phone_number: '',
    city: '',
    street: '',
    zip_code: ''
  };

  const [formData, setFormData] = useState(emptyForm);

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
    try {
      const payload = { ...formData };

      if (editingId) {
        await apiService.updateEmployee(editingId, payload);
        setIsModalOpen(false);
      } else {
        delete payload.id_employee;
        
        // Capture the response which now contains the generated_password
        const response = await apiService.createEmployee(payload);
        console.log("API RESPONSE:", response); // Look at this in your browser console!
        setIsModalOpen(false);
        
        // If the backend sent back the generated password, show the success modal
        if (response && response.generated_password) {
          setNewEmployeeCredentials({
            name: `${payload.empl_name} ${payload.empl_surname}`,
            id: response.id_employee,
            password: response.generated_password
          });
        }
      }
      
      loadEmployees();
    } catch (error) {
      console.error("Помилка збереження:", error);

      // Базове повідомлення
      let errorMessage = "Не вдалося зберегти працівника.";
      // Перевіряємо, чи є детальна відповідь від сервера
      if (error.response) {
        // Обробляємо як помилки валідації (422), так і помилки бізнес-логіки/БД (400)
        if (error.response.status === 422 || error.response.status === 400) {
          const detail = error.response.data.detail;
          
          if (Array.isArray(detail)) {
            // Якщо це масив помилок від Pydantic
            errorMessage = detail.map(err => err.msg).join('; ');
          } else if (typeof detail === 'string') {
            // Якщо помилка — це просто рядок (як у випадку з constraints БД)
            errorMessage = detail;
          } else {
            // Фоллбек, якщо структура інша
            errorMessage = JSON.stringify(error.response.data);
          }
        } else if (error.response.data && error.response.data.message) {
          // Для інших статусів (наприклад 500)
          errorMessage = error.response.data.message;
        }
      }

      // Виводимо деталізовану помилку замість заглушки
      alert(errorMessage);
    }
  };

  const openModal = (emp = null) => {
    if (emp) {
      setEditingId(emp.id_employee);
      setFormData(emp);
    } else {
      setEditingId(null);
      setFormData(emptyForm);
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
          className="flex-2 border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition text-lg w-full"
        />
        <select
          value={roleFilter}
          onChange={handleRoleChange}
          className="flex-1 border-2 border-gray-200 p-3 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500"
        >
          <option value="">Всі посади</option>
          <option value="Cashier">Касир</option>
          <option value="Manager">Менеджер</option>
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

      {/* Модальне вікно створення/редагування */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">{editingId ? 'Редагувати працівника' : 'Новий працівник'}</h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {editingId && (
                  <input 
                    disabled
                    placeholder="ID працівника" 
                    className="w-full border p-3 rounded-lg bg-gray-100 text-gray-500" 
                    value={formData.id_employee} 
                  />
                )}

                <input required placeholder="Прізвище" className="w-full border p-3 rounded-lg" value={formData.empl_surname} onChange={e => setFormData({...formData, empl_surname: e.target.value})} />
                <input required placeholder="Ім'я" className="w-full border p-3 rounded-lg" value={formData.empl_name} onChange={e => setFormData({...formData, empl_name: e.target.value})} />
                
                <select className="w-full border p-3 rounded-lg" value={formData.empl_role} onChange={e => setFormData({...formData, empl_role: e.target.value})}>
                  <option value="Cashier">Касир</option>
                  <option value="Manager">Менеджер</option>
                </select>

                <input required type="number" step="0.01" min="0" placeholder="Зарплата" className="w-full border p-3 rounded-lg" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />

                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1 ml-1">Дата народження</label>
                  <input required type="date" className="w-full border p-3 rounded-lg" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                </div>

                <div className="w-full">
                  <label className="block text-xs text-gray-500 mb-1 ml-1">Дата початку роботи</label>
                  <input required type="date" className="w-full border p-3 rounded-lg" value={formData.date_of_start} onChange={e => setFormData({...formData, date_of_start: e.target.value})} />
                </div>

                <input 
                  type="tel" 
                  required 
                  placeholder="Телефон (+380XXXXXXXXX)" 
                  className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-200" 
                  value={formData.phone_number} 
                  onChange={e => setFormData({...formData, phone_number: e.target.value})}
                  pattern="^\+380\d{9}$" 
                  maxLength="13"
                  title="Номер телефону має починатися з +380 і містити рівно 13 символів"
                />

                <input required placeholder="Місто" className="w-full border p-3 rounded-lg" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                <input required placeholder="Вулиця" className="w-full border p-3 rounded-lg" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                <input required placeholder="Поштовий індекс" className="w-full border p-3 rounded-lg" value={formData.zip_code} onChange={e => setFormData({...formData, zip_code: e.target.value})} />

              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2.5 rounded-lg transition">Скасувати</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* НОВЕ МОДАЛЬНЕ ВІКНО: Відображення згенерованих даних */}
      {newEmployeeCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center border-t-8 border-green-500 transform transition-all">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Працівника створено!</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Обов'язково збережіть ці дані. З міркувань безпеки пароль <strong>більше не відображатиметься</strong>.
            </p>
            
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-left space-y-4 mb-8">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Працівник</span>
                <div className="font-medium text-gray-900 mt-1">{newEmployeeCredentials.name}</div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID (Логін)</span>
                <div className="font-mono font-bold text-lg text-blue-700 mt-1">{newEmployeeCredentials.id}</div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Пароль</span>
                <div className="font-mono font-bold text-xl text-red-600 bg-red-50 p-2 rounded mt-1 select-all text-center tracking-widest border border-red-100">
                  {newEmployeeCredentials.password}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setNewEmployeeCredentials(null)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-sm"
            >
              Я зберіг дані, закрити
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;