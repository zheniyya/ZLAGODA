import { useState } from 'react';

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

  const downloadReport = async (endpoint, filename, params = {}) => {
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
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Помилка генерації звіту:", error);
      alert(`Помилка: ${error.message}`);
    }
  };

  // --- Функції-обгортки для кожного звіту з параметрами ---
  const downloadEmployeesReport = () => {
    const params = {};
    if (filterValues.employeesRole) params.role = filterValues.employeesRole;
    downloadReport('/reports/employees', 'employees_report.pdf', params);
  };

  const downloadProductsReport = () => {
    const params = {};
    if (filterValues.productsCategoryId) params.category_id = filterValues.productsCategoryId;
    downloadReport('/reports/products', 'products_report.pdf', params);
  };

  const downloadChecksReport = () => {
    const params = {};
    if (filterValues.checksCashierId) params.cashier_id = filterValues.checksCashierId;
    if (filterValues.checksStartDate) params.start_date = filterValues.checksStartDate;
    if (filterValues.checksEndDate) params.end_date = filterValues.checksEndDate;
    downloadReport('/reports/checks', 'checks_report.pdf', params);
  };

  const downloadStoreProductsReport = () => {
    const params = {};
    if (filterValues.storePromotional !== '') {
      params.promotional = filterValues.storePromotional === 'true';
    }
    downloadReport('/reports/store_products', 'store_products_report.pdf', params);
  };

  const downloadCategoriesReport = () => {
    downloadReport('/reports/categories', 'categories_report.pdf');
  };

  const downloadCustomerCardsReport = () => {
    const params = {};
    if (filterValues.cardsMinPercent) params.min_percent = filterValues.cardsMinPercent;
    downloadReport('/reports/customer_cards', 'customer_cards_report.pdf', params);
  };

  const downloadCashierSummaryReport = () => {
    const params = {};
    if (filterValues.cashierSummaryId) params.cashier_id = filterValues.cashierSummaryId;
    if (filterValues.cashierSummaryStart) params.start_date = filterValues.cashierSummaryStart;
    if (filterValues.cashierSummaryEnd) params.end_date = filterValues.cashierSummaryEnd;
    downloadReport('/reports/cashier-summary', 'cashier_summary.pdf', params);
  };

  return (
    <div className="p-6 md:p-10">
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
                onClick={downloadEmployeesReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF
              </button>
            </div>
          )}
          {!showFilters.employees && (
            <div className="mt-4">
              <button
                onClick={downloadEmployeesReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF (всі)
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
                <p className="text-sm text-gray-500">Фільтр за категорією (ID)</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ID категорії</label>
                <input
                  type="number"
                  placeholder="Наприклад, 1"
                  value={filterValues.productsCategoryId}
                  onChange={(e) => handleFilterChange('productsCategoryId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
              </div>
              <button
                onClick={downloadProductsReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF
              </button>
            </div>
          )}
          {!showFilters.products && (
            <div className="mt-4">
              <button
                onClick={downloadProductsReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF (всі)
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ID касира</label>
                <input
                  type="text"
                  placeholder="Наприклад, CSH001"
                  value={filterValues.checksCashierId}
                  onChange={(e) => handleFilterChange('checksCashierId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
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
                onClick={downloadChecksReport}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF
              </button>
            </div>
          )}
          {!showFilters.checks && (
            <div className="mt-4">
              <button
                onClick={downloadChecksReport}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF (всі)
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
                onClick={downloadStoreProductsReport}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF
              </button>
            </div>
          )}
          {!showFilters.store && (
            <div className="mt-4">
              <button
                onClick={downloadStoreProductsReport}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF (всі)
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
              onClick={downloadCategoriesReport}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
            >
              Завантажити PDF
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
                onClick={downloadCustomerCardsReport}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF
              </button>
            </div>
          )}
          {!showFilters.cards && (
            <div className="mt-4">
              <button
                onClick={downloadCustomerCardsReport}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Завантажити PDF (всі)
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ID касира (обов'язково)</label>
                <input
                  type="text"
                  placeholder="Наприклад, CSH001"
                  value={filterValues.cashierSummaryId}
                  onChange={(e) => handleFilterChange('cashierSummaryId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                />
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
                onClick={downloadCashierSummaryReport}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
                disabled={!filterValues.cashierSummaryId}
              >
                Завантажити PDF
              </button>
            </div>
          )}
          {!showFilters.cashierSummary && (
            <div className="mt-4">
              <button
                onClick={() => toggleFilters('cashierSummary')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                Налаштувати та завантажити
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;