import { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const Stats = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'sales', 'promo', 'notsold'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Дані для звітів
  const [customerData, setCustomerData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [promoData, setPromoData] = useState([]);
  const [notSoldData, setNotSoldData] = useState([]);
  const [daysParam, setDaysParam] = useState(30);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'customers') {
        const data = await apiService.getCustomerSummary();
        setCustomerData(data);
      } else if (activeTab === 'sales') {
        const data = await apiService.getSalesByCategoryMonth();
        setSalesData(data);
      } else if (activeTab === 'promo') {
        const data = await apiService.getPromoNeverSold();
        setPromoData(data);
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
  }, [activeTab, daysParam]);

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
          { key: 'customers', label: '👥 Клієнти (витрати/економія)' },
          { key: 'sales', label: '📈 Продажі за категоріями' },
          { key: 'promo', label: '🏷️ Непродані акційні товари' },
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

      {/* Вкладка 1: Звіт по клієнтах */}
      {activeTab === 'customers' && !loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Картка</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клієнт</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Чеків</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Сплачено (зі знижкою)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Без знижки</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Економія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customerData.length > 0 ? (
                customerData.map(c => (
                  <tr key={c.card_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">{c.card_number}</td>
                    <td className="px-6 py-4 text-sm">{c.cust_surname} {c.cust_name}</td>
                    <td className="px-6 py-4 text-sm text-center">{c.total_checks}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(c.total_spent_with_discount)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{formatCurrency(c.total_without_discount)}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">{formatCurrency(c.total_saved)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Немає даних</td></tr>
              )}
            </tbody>
          </table>
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

      {/* Вкладка 3: Акційні товари, що не продавались */}
      {activeTab === 'promo' && !loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID товару</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Назва</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UPC (акційний)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Акційна ціна</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promoData.length > 0 ? (
                promoData.map(item => (
                  <tr key={item.promo_upc} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{item.id_product}</td>
                    <td className="px-6 py-4 text-sm font-medium">{item.product_name}</td>
                    <td className="px-6 py-4 text-sm font-mono">{item.promo_upc}</td>
                    <td className="px-6 py-4 text-sm text-right">{formatCurrency(item.promo_price)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Усі акційні товари мали продажі.</td></tr>
              )}
            </tbody>
          </table>
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