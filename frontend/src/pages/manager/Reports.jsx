// Видаляємо імпорт axiosClient, він тут не знадобиться
// import axiosClient from '../../api/axiosClient'; 

const Reports = () => {
  const downloadReport = async (endpoint, filename) => {
    try {
      // 1. Дістаємо токен
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Помилка: Ви не авторизовані (токен відсутній). Будь ласка, увійдіть знову.");
        return;
      }

      // 2. Формуємо повний URL (зверніть увагу на базовий шлях)
      // Якщо ваш бекенд на порту 8000, вказуємо його тут:
      const fullUrl = `http://localhost:8000/api${endpoint}`;

      // 3. Використовуємо native fetch з явним заголовком Authorization
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

      // 4. Отримуємо Blob і завантажуємо
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

  return (
    <div className="p-6 md:p-10">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Друк Звітів</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
          onClick={() => downloadReport('/reports/employees', 'employees_report.pdf')}
          className="bg-white border rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center justify-center transition duration-200"
        >
          <span className="text-4xl mb-3">👥</span>
          <span className="font-bold text-lg text-gray-700">Звіт: Працівники</span>
          <span className="text-sm text-gray-400 mt-2">Завантажити PDF</span>
        </button>

        <button 
          onClick={() => downloadReport('/reports/products', 'products_report.pdf')}
          className="bg-white border rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center justify-center transition duration-200"
        >
          <span className="text-4xl mb-3">📦</span>
          <span className="font-bold text-lg text-gray-700">Звіт: Довідник Товарів</span>
          <span className="text-sm text-gray-400 mt-2">Завантажити PDF</span>
        </button>

        <button 
          onClick={() => downloadReport('/reports/checks', 'checks_report.pdf')}
          className="bg-white border rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center justify-center transition duration-200"
        >
          <span className="text-4xl mb-3">🧾</span>
          <span className="font-bold text-lg text-gray-700">Звіт: Всі чеки</span>
          <span className="text-sm text-gray-400 mt-2">Завантажити PDF</span>
        </button>

        <button 
          onClick={() => downloadReport('/reports/store_products', 'store_products_report.pdf')}
          className="bg-white border rounded-xl shadow-sm hover:shadow-md p-6 flex flex-col items-center justify-center transition duration-200"
        >
          <span className="text-4xl mb-3">🏪</span>
          <span className="font-bold text-lg text-gray-700">Звіт: Товари у магазині</span>
          <span className="text-sm text-gray-400 mt-2">Завантажити PDF</span>
        </button>
      </div>
    </div>
  );
};

export default Reports;