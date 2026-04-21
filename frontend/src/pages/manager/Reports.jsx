import { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const Reports = () => {
  const [showFilters, setShowFilters] = useState({});
  const [filterValues, setFilterValues] = useState({
    employeesRole: '',
    productsCategoryId: '',
    checksCashierId: '',
    checksStartDate: '',
    checksEndDate: '',
    storePromotional: '',
    cardsMinPercent: '',
    cashierSummaryId: '',
    cashierSummaryStart: '',
    cashierSummaryEnd: ''
  });

  // --- ДАНІ ДЛЯ ВИПАДАЮЧИХ СПИСКІВ ---
  const [categories, setCategories] = useState([]);
  const [cashiers, setCashiers] = useState([]);

  // --- СТАН ДЛЯ ПОПЕРЕДНЬОГО ПЕРЕГЛЯДУ PDF ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Завантажуємо категорії та касирів для "дружнього" інтерфейсу
    const fetchDropdownData = async () => {
      try {
        const fetchedCategories = await apiService.getCategories();
        setCategories(fetchedCategories);

        const fetchedEmployees = await apiService.getEmployees({ role: 'cashier' });
        setCashiers(fetchedEmployees);
      } catch (error) {
        console.error("Помилка завантаження даних для фільтрів:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const toggleFilters = (reportKey) => {
    setShowFilters(prev => ({ ...prev, [reportKey]: !prev[reportKey] }));
  };

  const handleFilterChange = (field, value) => {
    setFilterValues(prev => ({ ...prev, [field]: value }));
  };

  const buildQueryString = (params) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    return qs ? `?${qs}` : '';
  };

  const previewReport = async (endpoint, params = {}) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Помилка: Ви не авторизовані (токен відсутній). Будь ласка, увійдіть знову.");
        return;
      }

      const queryString = buildQueryString(params);
      const fullUrl = `http://localhost:8000/api${endpoint}${queryString}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Не авторизовано (401)");
        if (response.status === 404) throw new Error("Звіт не знайдено (404)");
        throw new Error(`Помилка сервера: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url); // Відкриваємо модалку замість збереження файлу
    } catch (error) {
      console.error("Помилка генерації звіту:", error);
      alert(`Помилка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // --- Функції-обгортки для кожного звіту з параметрами ---
  const handlePreviewEmployees = () => {
    const params = {};
    if (filterValues.employeesRole) params.role = filterValues.employeesRole;
    previewReport('/reports/employees', params);
  };

  const handlePreviewProducts = () => {
    const params = {};
    if (filterValues.productsCategoryId) params.category_id = filterValues.productsCategoryId;
    previewReport('/reports/products', params);
  };

  const handlePreviewChecks = () => {
    const params = {};
    if (filterValues.checksCashierId) params.cashier_id = filterValues.checksCashierId;
    if (filterValues.checksStartDate) params.start_date = filterValues.checksStartDate;
    if (filterValues.checksEndDate) params.end_date = filterValues.checksEndDate;
    previewReport('/reports/checks', params);
  };

  const handlePreviewStoreProducts = () => {
    const params = {};
    if (filterValues.storePromotional !== '') {
      params.promotional = filterValues.storePromotional === 'true';
    }
    previewReport('/reports/store_products', params);
  };

  const handlePreviewCategories = () => {
    previewReport('/reports/categories');
  };

  const handlePreviewCustomerCards = () => {
    const params = {};
    if (filterValues.cardsMinPercent) params.min_percent = filterValues.cardsMinPercent;
    previewReport('/reports/customer_cards', params);
  };

  const handlePreviewCashierSummary = () => {
    const params = {};
    if (filterValues.cashierSummaryId) params.cashier_id = filterValues.cashierSummaryId;
    if (filterValues.cashierSummaryStart) params.start_date = filterValues.cashierSummaryStart;
    if (filterValues.cashierSummaryEnd) params.end_date = filterValues.cashierSummaryEnd;
    previewReport('/reports/cashier-summary', params);
  };

  return (
    <div className="p-6 md:p-10 relative">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Друк Звітів з фільтрацією</h2>

      <div className="space-y-6">
        {/* --- ЗВІТ ПО ПРАЦІВНИКАХ --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">👥</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Звіт: Працівники</h3>
                <p className="text-sm text-gray-500">Фільтр за посадою (cashier / manager)</p>
              </div>
            </div>
            <button
              onClick={() => toggleFilters('employees')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showFilters.employees ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
          </div>

          {showFilters.employees && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Посада</label>
                <select
                  value={filterValues.employeesRole}
                  onChange={(e) => handleFilterChange('employeesRole', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="">Всі</option>
                  <option value="cashier">Касири</option>
                  <option value="manager">Менеджери</option>
                </select>
              </div>
              <button
                onClick={handlePreviewEmployees}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт
              </button>
            </div>
          )}
          {!showFilters.employees && (
            <div className="mt-4">
              <button
                onClick={handlePreviewEmployees}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт (всі)
              </button>
            </div>
          )}
        </div>

        {/* --- ЗВІТ ПО ТОВАРАХ (ДОВІДНИК) --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">📦</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Звіт: Довідник Товарів</h3>
                <p className="text-sm text-gray-500">Фільтр за категорією</p>
              </div>
            </div>
            <button
              onClick={() => toggleFilters('products')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showFilters.products ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
          </div>

          {showFilters.products && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Оберіть категорію</label>
                <select
                  value={filterValues.productsCategoryId}
                  onChange={(e) => handleFilterChange('productsCategoryId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="">Всі категорії</option>
                  {categories.map(c => (
                    <option key={c.category_number} value={c.category_number}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePreviewProducts}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт
              </button>
            </div>
          )}
          {!showFilters.products && (
            <div className="mt-4">
              <button
                onClick={handlePreviewProducts}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт (всі)
              </button>
            </div>
          )}
        </div>

        {/* --- ЗВІТ ПО ЧЕКАХ --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🧾</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Звіт: Всі чеки</h3>
                <p className="text-sm text-gray-500">Фільтр за касиром та періодом</p>
              </div>
            </div>
            <button
              onClick={() => toggleFilters('checks')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showFilters.checks ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
          </div>

          {showFilters.checks && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Оберіть касира</label>
                <select
                  value={filterValues.checksCashierId}
                  onChange={(e) => handleFilterChange('checksCashierId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="">Всі касири</option>
                  {cashiers.map(c => (
                    <option key={c.id_employee} value={c.id_employee}>
                      {c.empl_surname} {c.empl_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Початкова дата</label>
                <input
                  type="date"
                  value={filterValues.checksStartDate}
                  onChange={(e) => handleFilterChange('checksStartDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кінцева дата</label>
                <input
                  type="date"
                  value={filterValues.checksEndDate}
                  onChange={(e) => handleFilterChange('checksEndDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <button
                onClick={handlePreviewChecks}
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт
              </button>
            </div>
          )}
          {!showFilters.checks && (
            <div className="mt-4">
              <button
                onClick={handlePreviewChecks}
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт (всі)
              </button>
            </div>
          )}
        </div>

        {/* --- ЗВІТ ПО ТОВАРАХ У МАГАЗИНІ --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🏪</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Звіт: Товари у магазині</h3>
                <p className="text-sm text-gray-500">Фільтр: тільки акційні / всі</p>
              </div>
            </div>
            <button
              onClick={() => toggleFilters('store')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showFilters.store ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
          </div>

          {showFilters.store && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Акційність</label>
                <select
                  value={filterValues.storePromotional}
                  onChange={(e) => handleFilterChange('storePromotional', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="">Всі</option>
                  <option value="true">Тільки акційні</option>
                  <option value="false">Тільки звичайні</option>
                </select>
              </div>
              <button
                onClick={handlePreviewStoreProducts}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт
              </button>
            </div>
          )}
          {!showFilters.store && (
            <div className="mt-4">
              <button
                onClick={handlePreviewStoreProducts}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт (всі)
              </button>
            </div>
          )}
        </div>

        {/* --- ЗВІТ ПО КАТЕГОРІЯХ (без фільтрів) --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🗂️</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Звіт: Категорії</h3>
                <p className="text-sm text-gray-500">Повний список категорій</p>
              </div>
            </div>
            <button
              onClick={handlePreviewCategories}
              disabled={isLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
            >
              Переглянути звіт
            </button>
          </div>
        </div>

        {/* --- ЗВІТ ПО КАРТКАХ КЛІЄНТІВ --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">💳</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Звіт: Картки клієнтів</h3>
                <p className="text-sm text-gray-500">Фільтр за мінімальним відсотком знижки</p>
              </div>
            </div>
            <button
              onClick={() => toggleFilters('cards')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showFilters.cards ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
          </div>

          {showFilters.cards && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Мін. знижка (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Наприклад, 10"
                  value={filterValues.cardsMinPercent}
                  onChange={(e) => handleFilterChange('cardsMinPercent', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <button
                onClick={handlePreviewCustomerCards}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт
              </button>
            </div>
          )}
          {!showFilters.cards && (
            <div className="mt-4">
              <button
                onClick={handlePreviewCustomerCards}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт (всі)
              </button>
            </div>
          )}
        </div>

        {/* --- ЗВЕДЕНИЙ ЗВІТ ПО КАСИРУ --- */}
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">📊</span>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Зведений звіт по касиру</h3>
                <p className="text-sm text-gray-500">Кількість чеків та загальна сума продажів</p>
              </div>
            </div>
            <button
              onClick={() => toggleFilters('cashierSummary')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showFilters.cashierSummary ? 'Сховати фільтри' : 'Показати фільтри'}
            </button>
          </div>

          {showFilters.cashierSummary && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Оберіть касира (обов'язково)</label>
                <select
                  value={filterValues.cashierSummaryId}
                  onChange={(e) => handleFilterChange('cashierSummaryId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="">Оберіть касира...</option>
                  {cashiers.map(c => (
                    <option key={c.id_employee} value={c.id_employee}>
                      {c.empl_surname} {c.empl_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Початкова дата</label>
                <input
                  type="date"
                  value={filterValues.cashierSummaryStart}
                  onChange={(e) => handleFilterChange('cashierSummaryStart', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кінцева дата</label>
                <input
                  type="date"
                  value={filterValues.cashierSummaryEnd}
                  onChange={(e) => handleFilterChange('cashierSummaryEnd', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <button
                onClick={handlePreviewCashierSummary}
                disabled={!filterValues.cashierSummaryId || isLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Переглянути звіт
              </button>
            </div>
          )}
          {!showFilters.cashierSummary && (
            <div className="mt-4">
              <button
                onClick={() => toggleFilters('cashierSummary')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-50"
              >
                Налаштувати та переглянути
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== ВБУДОВАНИЙ ПЕРЕГЛЯДАЧ PDF ========== */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 bg-opacity-95 p-4 md:p-8">
          <div className="flex justify-between items-center mb-4 text-white">
            <div>
              <h2 className="text-2xl font-bold">Попередній перегляд звіту</h2>
              <p className="text-sm text-gray-400 mt-1">Використовуйте іконку принтера або завантаження у панелі PDF-переглядача.</p>
            </div>
            <button 
              onClick={closePreview} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg"
            >
              Закрити перегляд
            </button>
          </div>
          <div className="flex-1 bg-white rounded-lg shadow-2xl overflow-hidden">
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none" 
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;