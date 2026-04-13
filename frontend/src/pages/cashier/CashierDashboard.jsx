import { Link } from 'react-router-dom';

const CashierDashboard = () => {
  const menuItems = [
    { title: '🛒 Новий продаж', desc: 'Сканування товарів, додавання карт клієнтів, фіскалізація чека.', link: '/cashier/create-check', color: 'bg-green-600' },
    { title: '🧾 Мої чеки', desc: 'Історія створених вами чеків. Фільтрація за датою, перегляд товарів у чеку.', link: '/cashier/checks', color: 'bg-blue-600' },
    { title: '🛍️ Карти клієнтів', desc: 'Пошук клієнтів за прізвищем, реєстрація нових карт та оновлення даних.', link: '/cashier/customers', color: 'bg-orange-500' },
    { title: '👤 Мій профіль', desc: 'Перегляд особистої інформації (адреса, телефон).', link: '/cashier/profile', color: 'bg-slate-600' }
  ];

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Каса (Робоче місце касира)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {menuItems.map((item, idx) => (
          <div key={idx} className="bg-white border rounded-xl shadow-sm hover:shadow-lg transition duration-200 p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2">{item.title}</h2>
            <p className="text-gray-500 mb-6 flex-1">{item.desc}</p>
            <Link to={item.link} className={`${item.color} text-white text-center py-3 px-4 rounded-lg font-medium hover:opacity-90`}>
              Відкрити
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashierDashboard;