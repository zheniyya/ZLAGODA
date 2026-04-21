import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import debounce from 'lodash/debounce';

const Customers = () => {
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [loading, setLoading] = useState(false);

  // Стейт для редагування/створення
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Стейт для детального перегляду
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  
  const defaultFormState = { 
    cust_surname: '', 
    cust_name: '', 
    cust_patronymic: '', 
    phone_number: '', 
    city: '', 
    street: '', 
    zip_code: '', 
    percent: 0 
  };
  const [formData, setFormData] = useState(defaultFormState);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (minDiscount) params.min_discount = minDiscount;
      const data = await apiService.getCustomers(params);
      setCustomers(data);
    } catch (error) {
      console.error('Помилка завантаження:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, minDiscount]);

  const debouncedLoad = useCallback(debounce(loadCustomers, 300), [loadCustomers]);

  useEffect(() => {
    debouncedLoad();
    return () => debouncedLoad.cancel();
  }, [debouncedLoad]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await apiService.updateCustomer(editingCustomer.card_number, formData);
    } else {
      await apiService.createCustomer(formData);
    }
    setIsModalOpen(false);
    loadCustomers();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Видалити клієнта?')) {
      try {
        await apiService.deleteCustomer(id);
        loadCustomers(); // Оновлюємо список лише якщо видалення успішне
      } catch (error) {
        console.error('Помилка видалення клієнта:', error);
        
        // FastAPI зазвичай повертає деталі помилки у полі error.response.data.detail
        const errorMessage = error.response?.data?.detail || "Не вдалося видалити клієнта. Перевірте підключення до сервера.";
        
        // Виводимо повідомлення для користувача
        alert(`Помилка: ${errorMessage}`);
      }
    }
  };

  const openModal = (customer = null) => {
    setEditingCustomer(customer);
    setFormData(customer || defaultFormState);
    setIsModalOpen(true);
  };

  const openDetailsModal = (customer) => {
    setViewingCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Постійні Клієнти</h2>
        <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          + Додати клієнта
        </button>
      </div>

      <div className="flex-1 flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="🔍 Пошук за прізвищем або номером карти..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-2 border p-2 rounded"
        />
        <input
          type="number"
          min="0"
          max="100"
          placeholder="Мін. знижка %"
          value={minDiscount}
          onChange={e => setMinDiscount(e.target.value)}
          className="w-32 border p-2 rounded"
        />
      </div>

      {loading && <div className="text-center py-4">Завантаження...</div>}

      <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3">Номер карти</th>
            <th className="p-3">ПІБ</th>
            <th className="p-3">Телефон</th>
            <th className="p-3">Місто</th>
            <th className="p-3">Знижка</th>
            <th className="p-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.card_number} className="border-b hover:bg-gray-50">
              <td className="p-3 font-mono text-sm">{c.card_number}</td>
              <td className="p-3 font-semibold">{`${c.cust_surname} ${c.cust_name} ${c.cust_patronymic || ''}`.trim()}</td>
              <td className="p-3">{c.phone_number}</td>
              <td className="p-3">{c.city || '-'}</td>
              <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">{c.percent}%</span></td>
              <td className="p-3 text-right space-x-2">
                {/* Нова кнопка Деталі */}
                <button onClick={() => openDetailsModal(c)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">Деталі</button>
                <button onClick={() => openModal(c)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Ред.</button>
                {user?.role === 'manager' && (
                  <button onClick={() => handleDelete(c.card_number)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                    Видалити
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модальне вікно для редагування/додавання */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingCustomer ? 'Редагувати клієнта' : 'Новий клієнт'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Прізвище" className="w-full border p-2 rounded" value={formData.cust_surname} onChange={e => setFormData({...formData, cust_surname: e.target.value})} />
              <input required placeholder="Ім'я" className="w-full border p-2 rounded" value={formData.cust_name} onChange={e => setFormData({...formData, cust_name: e.target.value})} />
              <input placeholder="По батькові" className="w-full border p-2 rounded" value={formData.cust_patronymic || ''} onChange={e => setFormData({...formData, cust_patronymic: e.target.value})} />
              
              <input
                type="tel"
                required
                placeholder="Телефон (+380XXXXXXXXX)"
                className="w-full border p-2 rounded"
                value={formData.phone_number}
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                pattern="^\+380\d{9}$"
                maxLength="13"
              />
              
              <input placeholder="Місто" className="w-full border p-2 rounded" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
              <input placeholder="Вулиця" className="w-full border p-2 rounded" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} />
              <input placeholder="Поштовий код" className="w-full border p-2 rounded" value={formData.zip_code || ''} onChange={e => setFormData({...formData, zip_code: e.target.value})} />

              <label className="block text-sm text-gray-600">Відсоток знижки:</label>
              <input required type="number" min="0" max="100" placeholder="Відсоток знижки" className="w-full border p-2 rounded" value={formData.percent} onChange={e => setFormData({...formData, percent: Number(e.target.value)})} />
              
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Скасувати</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Нове модальне вікно для детального перегляду */}
      {isDetailsModalOpen && viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Деталі клієнта</h3>
            <div className="space-y-3 text-gray-800">
              <p><span className="font-semibold text-gray-600">Номер карти:</span> <span className="font-mono">{viewingCustomer.card_number}</span></p>
              <p><span className="font-semibold text-gray-600">ПІБ:</span> {`${viewingCustomer.cust_surname} ${viewingCustomer.cust_name} ${viewingCustomer.cust_patronymic || ''}`.trim()}</p>
              <p><span className="font-semibold text-gray-600">Телефон:</span> {viewingCustomer.phone_number}</p>
              <p><span className="font-semibold text-gray-600">Місто:</span> {viewingCustomer.city || 'Не вказано'}</p>
              <p><span className="font-semibold text-gray-600">Вулиця:</span> {viewingCustomer.street || 'Не вказано'}</p>
              <p><span className="font-semibold text-gray-600">Поштовий код:</span> {viewingCustomer.zip_code || 'Не вказано'}</p>
              <p><span className="font-semibold text-gray-600">Відсоток знижки:</span> <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">{viewingCustomer.percent}%</span></p>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setIsDetailsModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;