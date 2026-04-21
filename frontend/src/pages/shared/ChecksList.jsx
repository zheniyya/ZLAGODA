import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import debounce from 'lodash/debounce';

const ChecksList = () => {
  const { user } = useContext(AuthContext);
  const [checks, setChecks] = useState([]);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [checkDetails, setCheckDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cashierId, setCashierId] = useState('');

  const loadChecks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (user?.role === 'manager' && cashierId) params.cashier_id = cashierId;
      else if (user?.role === 'cashier') params.cashier_id = user.id;

      const data = await apiService.getChecks(params);
      setChecks(data);
    } catch (error) {
      console.error("Помилка завантаження чеків:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cashierId, user]);

  const debouncedLoad = useCallback(debounce(loadChecks, 300), [loadChecks]);

  useEffect(() => {
    debouncedLoad();
    return () => debouncedLoad.cancel();
  }, [debouncedLoad]);

  const openDetails = async (checkNumber) => {
    setSelectedCheck(checkNumber);
    setCheckDetails([]); // Clear previous details immediately
    try {
      const details = await apiService.getCheckDetails(checkNumber);
      setCheckDetails(details);
    } catch (error) {
      console.error("Помилка завантаження деталей чека:", error);
      const errorMsg = error.response?.data?.detail || "Не вдалося завантажити деталі чека.";
      alert(errorMsg);
      setSelectedCheck(null); 
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

  const totalSum = checks.reduce((acc, c) => acc + Number(c.sum_total), 0);
  
  // NEW: Find the full check object from our list to access the card_number
  const activeCheck = checks.find(c => c.check_number === selectedCheck);

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-6">{user?.role === 'manager' ? 'Всі Чеки (Історія)' : 'Мої Чеки'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-6 rounded-lg shadow-sm">
        {user?.role === 'manager' && (
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">ID касира</label>
            <input
              type="text"
              placeholder="Наприклад, CSH001"
              value={cashierId}
              onChange={e => setCashierId(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />
          </div>
        )}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Початкова дата (З):</label>
          <input type="date" className="w-full border p-3 rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Кінцева дата (До):</label>
          <input type="date" className="w-full border p-3 rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={() => { setStartDate(''); setEndDate(''); setCashierId(''); }} className="w-full bg-gray-200 p-3 rounded-lg hover:bg-gray-300 font-semibold">
            Скинути фільтри
          </button>
        </div>
        {user?.role === 'manager' && (
          <div className="md:col-span-4 text-right text-xl font-bold text-green-700 mt-2 border-t pt-4">
            Загальна сума збуту за період: {totalSum.toFixed(2)} ₴
          </div>
        )}
      </div>

      {loading && <div className="text-center py-4">Завантаження...</div>}

      <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="p-3">Номер чека</th>
            <th className="p-3">Дата</th>
            <th className="p-3">Касир</th>
            <th className="p-3">Сума (₴)</th>
            <th className="p-3">ПДВ (₴)</th>
            <th className="p-3 text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {checks.length > 0 ? (
            checks.map(c => (
              <tr key={c.check_number} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{c.check_number}</td>
                <td className="p-3">{new Date(c.print_date).toLocaleString('uk-UA')}</td>
                <td className="p-3">{c.id_employee}</td>
                <td className="p-3 font-bold">{Number(c.sum_total).toFixed(2)}</td>
                <td className="p-3 font-bold">{Number(c.vat).toFixed(2)}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openDetails(c.check_number)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200">Деталі</button>
                  {user?.role === 'manager' && (
                    <button onClick={() => handleDelete(c.check_number)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Видалити</button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="p-6 text-center text-gray-500">Чеків не знайдено за обраний період.</td></tr>
          )}
        </tbody>
      </table>

      {/* Модальне вікно деталей */}
      {selectedCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold text-gray-800">Деталі чека #{selectedCheck}</h3>
              <button onClick={() => setSelectedCheck(null)} className="text-gray-500 hover:text-red-600 text-3xl leading-none">&times;</button>
            </div>
            
            {/* NEW: Customer Card Display block */}
            {activeCheck?.card_number && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-center">
                <span className="font-semibold mr-2">💳 Використана карта клієнта:</span> 
                <span className="font-mono">{activeCheck.card_number}</span>
              </div>
            )}

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
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">Завантаження товарів...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <button onClick={() => setSelectedCheck(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold">
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