import { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';

const Customers = () => {
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('cust_surname');
  
  // Стан для модального вікна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ cust_surname: '', cust_name: '', phone_number: '', percent: 0 });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    const data = await apiService.getCustomers();
    setCustomers(data);
  };

  // --- ЛОГІКА ПОШУКУ ТА СОРТУВАННЯ (Згідно ТЗ) ---
  const filteredAndSorted = useMemo(() => {
    // Пошук за прізвищем (Касир п.6)
    let result = customers.filter(c => 
      c.cust_surname.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Сортування (Менеджер п.7, Касир п.3)
    result.sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return -1;
      if (a[sortKey] > b[sortKey]) return 1;
      return 0;
    });
    
    return result;
  }, [customers, searchQuery, sortKey]);

  // --- CRUD ОПЕРАЦІЇ ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await apiService.updateCustomer(editingCustomer.card_number, formData);
    } else {
      await apiService.createCustomer(formData);
    }
    setIsModalOpen(false);
    loadCustomers(); // Оновлюємо таблицю
  };

  const handleDelete = async (id) => {
    if (window.confirm('Видалити клієнта?')) {
      await apiService.deleteCustomer(id);
      loadCustomers();
    }
  };

  const openModal = (customer = null) => {
    setEditingCustomer(customer);
    setFormData(customer || { cust_surname: '', cust_name: '', phone_number: '', percent: 0 });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Постійні Клієнти</h2>
        {/* Додавання дозволено і менеджеру, і касиру */}
        <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          + Додати клієнта
        </button>
      </div>

      <div className="flex gap-4 mb-6 bg-white p-4 rounded shadow-sm">
        <input 
          type="text" 
          placeholder="🔍 Пошук за прізвищем..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-2 border p-2 rounded"
        />
        <select onChange={(e) => setSortKey(e.target.value)} className="flex-1 border p-2 rounded">
          <option value="cust_surname">Сортувати за: Прізвищем</option>
          <option value="percent">Сортувати за: Знижкою (%)</option>
        </select>
      </div>

      <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3">Номер карти</th>
            <th className="p-3">ПІБ</th>
            <th className="p-3">Телефон</th>
            <th className="p-3">Знижка</th>
            <th className="p-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSorted.map(c => (
            <tr key={c.card_number} className="border-b hover:bg-gray-50">
              <td className="p-3 font-mono text-sm">{c.card_number}</td>
              <td className="p-3 font-semibold">{`${c.cust_surname} ${c.cust_name}`}</td>
              <td className="p-3">{c.phone_number}</td>
              <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">{c.percent}%</span></td>
              <td className="p-3 text-right space-x-2">
                {/* Редагування дозволено і менеджеру, і касиру */}
                <button onClick={() => openModal(c)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Ред.</button>
                
                {/* ВИЛУЧЕННЯ: ТІЛЬКИ МЕНЕДЖЕР */}
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

      {/* МОДАЛЬНЕ ВІКНО ФОРМИ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingCustomer ? 'Редагувати клієнта' : 'Новий клієнт'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Прізвище" className="w-full border p-2 rounded" value={formData.cust_surname} onChange={e => setFormData({...formData, cust_surname: e.target.value})} />
              <input required placeholder="Ім'я" className="w-full border p-2 rounded" value={formData.cust_name} onChange={e => setFormData({...formData, cust_name: e.target.value})} />
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
    </div>
  );
};

export default Customers;