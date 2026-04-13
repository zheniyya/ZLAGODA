import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';

const ChecksList = () => {
  const { user } = useContext(AuthContext);
  const [checks, setChecks] = useState([]);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [checkDetails, setCheckDetails] = useState([]);
  
  // Фільтр "З - До"
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadChecks = async () => {
    try {
      const data = await apiService.getChecks();
      setChecks(data);
    } catch (error) {
      console.error("Помилка завантаження чеків:", error);
    }
  };

  useEffect(() => { loadChecks(); }, []);

  const openDetails = async (checkNumber) => {
    setSelectedCheck(checkNumber);
    setCheckDetails([]); // Очищаємо попередні дані на час завантаження
    try {
      const details = await apiService.getCheckDetails(checkNumber);
      setCheckDetails(details);
    } catch (error) {
      console.error("Помилка завантаження деталей чека:", error);
      alert("Не вдалося завантажити деталі чека.");
    }
  };

  const handleDelete = async (checkNumber) => {
    if (window.confirm('Ви дійсно хочете видалити цей чек? Це незворотна дія.')) {
      try {
        await apiService.deleteCheck(checkNumber);
        loadChecks();
      } catch (error) {
        alert("Помилка при видаленні чека.");
      }
    }
  };

  const filteredChecks = useMemo(() => {
    let result = checks;
    if (user?.role === 'cashier') {
        result = result.filter(c => c.id_employee === user.id);
    }
    // Логіка фільтрації за періодом
    if (startDate) {
        result = result.filter(c => new Date(c.print_date) >= new Date(startDate));
    }
    if (endDate) {
        // Додаємо 1 день до endDate, щоб включити кінець обраного дня
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        result = result.filter(c => new Date(c.print_date) < end);
    }
    return result;
  }, [checks, user, startDate, endDate]);

  const totalSum = filteredChecks.reduce((acc, c) => acc + Number(c.sum_total), 0);

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-6">{user?.role === 'manager' ? 'Всі Чеки (Історія)' : 'Мої Чеки'}</h2>

      {/* ШИРОКІ ПОЛЯ ВВОДУ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Початкова дата (З):</label>
            <input type="date" className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-200" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Кінцева дата (До):</label>
            <input type="date" className="w-full border p-3 rounded-lg focus:ring focus:ring-blue-200" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-end space-x-2">
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="w-full bg-gray-200 p-3 rounded-lg hover:bg-gray-300 font-semibold transition">Скинути</button>
        </div>
        
        {user?.role === 'manager' && (
          <div className="md:col-span-3 text-right text-xl font-bold text-green-700 mt-2 border-t pt-4">
            Загальна сума збуту за період: {totalSum.toFixed(2)} ₴
          </div>
        )}
      </div>

      <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3">Номер чека</th>
            <th className="p-3">Дата</th>
            <th className="p-3">Касир</th>
            <th className="p-3">Сума (₴)</th>
            <th className="p-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {filteredChecks.length > 0 ? (
            filteredChecks.map(c => (
              <tr key={c.check_number} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{c.check_number}</td>
                <td className="p-3">{new Date(c.print_date).toLocaleString('uk-UA')}</td>
                <td className="p-3">{c.id_employee}</td>
                <td className="p-3 font-bold">{Number(c.sum_total).toFixed(2)}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openDetails(c.check_number)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition">Деталі</button>
                  {/* ВИЛУЧЕННЯ: ТІЛЬКИ МЕНЕДЖЕР */}
                  {user?.role === 'manager' && (
                    <button onClick={() => handleDelete(c.check_number)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition">Видалити</button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-6 text-center text-gray-500">Чеків не знайдено за обраний період.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ВІДНОВЛЕНЕ МОДАЛЬНЕ ВІКНО ДЕТАЛЕЙ */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold text-gray-800">Деталі чека #{selectedCheck}</h3>
              <button onClick={() => setSelectedCheck(null)} className="text-gray-500 hover:text-red-600 text-3xl leading-none">&times;</button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full mb-4 text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border-b">Товар</th>
                    <th className="p-2 border-b text-center">К-сть</th>
                    <th className="p-2 border-b text-right">Ціна</th>
                    <th className="p-2 border-b text-right">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {checkDetails && checkDetails.length > 0 ? (
                    checkDetails.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm">{item.name}</td>
                        <td className="p-2 text-center text-sm">{item.qty}</td>
                        <td className="p-2 text-right text-sm">{Number(item.price).toFixed(2)} ₴</td>
                        <td className="p-2 text-right font-semibold text-sm">{(item.price * item.qty).toFixed(2)} ₴</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-gray-500">Завантаження товарів...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t">
              <button onClick={() => setSelectedCheck(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition">
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecksList;