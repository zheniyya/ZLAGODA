import { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const Stats = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'sales', 'allPromoSold', 'notsold'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Дані для звітів
  const [customerData, setCustomerData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [allPromoSoldData, setAllPromoSoldData] = useState([]);
  const [notSoldData, setNotSoldData] = useState([]);

  // Параметри
  const [daysParam, setDaysParam] = useState(30);
  const [minPercentParam, setMinPercentParam] = useState(10);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'customers') {
        const data = await apiService.getCustomerSummary(minPercentParam);
        setCustomerData(data);
      } else if (activeTab === 'sales') {
        const data = await apiService.getSalesByCategoryMonth();
        setSalesData(data);
      } else if (activeTab === 'allPromoSold') {
        const data = await apiService.getCategoriesAllPromoSold();
        setAllPromoSoldData(data);
      } else if (activeTab === 'notsold') {
        const data = await apiService.getNotSoldForDays(daysParam);
        setNotSoldData(data);
      }
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження даних.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 2
    }).format(value);
  };

  const groupSalesByCategory = () => {
    const grouped = {};
    salesData.forEach(item => {
      const key = `${item.category_number}_${item.category_name}`;
      if (!grouped[key]) {
        grouped[key] = {
          category_number: item.category_number,
          category_name: item.category_name,
          months: []
        };
      }
      grouped[key].months.push({
        year: item.year,
        month: item.month,
        total_sales: item.total_sales
      });
    });
    return Object.values(grouped);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Аналітика та статистика</h1>

      {/* Вкладки */}
      <div className="flex border-b mb-6 bg-white rounded-t-lg shadow-sm overflow-x-auto">
        {[
          { key: 'customers', label: '💳 Продажі за знижкою клієнтів' },
          { key: 'sales', label: '📈 Продажі за категоріями' },
          { key: 'allPromoSold', label: '🏷️ Категорії з усіма акційними проданими' },
          { key: 'notsold', label: '📦 Не продавались N днів' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
      {loading && <div className="text-center py-8 text-gray-500">Завантаження...</div>}

      {/* Вкладка 1: Продажі за знижкою клієнтів */}
      {activeTab === 'customers' && !loading && (
        <div>
          <div className="mb-4 flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
            <label className="text-sm font-medium">Мінімальний відсоток знижки:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minPercentParam}
              onChange={(e) => setMinPercentParam(parseInt(e.target.value) || 0)}
              className="w-24 border rounded px-3 py-1"
            />
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Оновити
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Категорія</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Унікальних клієнтів</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Сума продажів</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customerData.length > 0 ? (
                  customerData.map(item => (
                    <tr key={item.category_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{item.category_name}</td>
                      <td className="px-6 py-4 text-sm text-center">{item.unique_customers}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">{formatCurrency(item.total_sales_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">Немає даних</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Вкладка 2: Продажі за категоріями та місяцями */}
      {activeTab === 'sales' && !loading && (
        <div className="space-y-6">
          {groupSalesByCategory().map(cat => (
            <div key={cat.category_number} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold mb-3">{cat.category_name} (ID: {cat.category_number})</h3>
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Рік-Місяць</th>
                    <th className="px-4 py-2 text-right">Продажі, ₴</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.months.map((m, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{m.year}-{String(m.month).padStart(2, '0')}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatCurrency(m.total_sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {salesData.length === 0 && <p className="text-center text-gray-500">Немає даних за останній рік.</p>}
        </div>
      )}

      {/* Вкладка 3: Категорії, де всі акційні товари продані */}
      {activeTab === 'allPromoSold' && !loading && (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Категорія (всі акційні товари продані хоча б раз)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allPromoSoldData.length > 0 ? (
                  allPromoSoldData.map(item => (
                    <tr key={item.category_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{item.category_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="1" className="px-6 py-8 text-center text-gray-500">
                    Немає категорій, де всі акційні товари були продані.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Вкладка 4: Товари на складі, що не продавались N днів */}
      {activeTab === 'notsold' && !loading && (
        <div>
          <div className="mb-4 flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
            <label className="text-sm font-medium">Не продавались останні</label>
            <input
              type="number"
              min="1"
              value={daysParam}
              onChange={(e) => setDaysParam(parseInt(e.target.value) || 30)}
              className="w-24 border rounded px-3 py-1"
            />
            <span className="text-sm">днів</span>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Оновити
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UPC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Назва</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Кількість</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ціна</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Акційний</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notSoldData.length > 0 ? (
                  notSoldData.map(item => (
                    <tr key={item.upc} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono">{item.upc}</td>
                      <td className="px-6 py-4 text-sm">{item.product_name}</td>
                      <td className="px-6 py-4 text-sm text-right">{item.products_number}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(item.selling_price)}</td>
                      <td className="px-6 py-4 text-sm text-center">{item.promotional_product ? 'Так' : 'Ні'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Немає товарів, що не продавались за цей період.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;