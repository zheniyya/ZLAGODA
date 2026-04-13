import { Link } from 'react-router-dom';

const Dashboard = () => {
  const menuItems = [
    { title: '👥 Працівники', desc: 'Управління персоналом, додавання, редагування, звільнення.', link: '/manager/employees', color: 'bg-blue-600' },
    { title: '📦 Довідник Товарів', desc: 'Категорії, характеристики товарів та керування каталогом.', link: '/manager/products', color: 'bg-indigo-600' },
    { title: '🏪 Товари у магазині', desc: 'Керування партіями, переоцінка, виставлення акцій (знижки 20%).', link: '/manager/products', color: 'bg-indigo-500' },
    { title: '🧾 Історія Чеків', desc: 'Перегляд всіх чеків, пошук за датою, видалення чеків, загальні суми.', link: '/manager/checks', color: 'bg-teal-600' },
    { title: '🛍️ Постійні Клієнти', desc: 'Керування картами клієнтів (додавання, зміна відсотків, видалення).', link: '/manager/customers', color: 'bg-orange-500' },
    { title: '📊 Друк Звітів', desc: 'Генерація та завантаження PDF-звітів по всій системі.', link: '/manager/reports', color: 'bg-red-600' }
  ];

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Панель Управління (Менеджер)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {menuItems.map((item, idx) => (
          <div key={idx} className="bg-white border rounded-xl shadow-sm hover:shadow-lg transition duration-200 p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2">{item.title}</h2>
            <p className="text-gray-500 mb-6 flex-1">{item.desc}</p>
            <Link to={item.link} className={`${item.color} text-white text-center py-2 px-4 rounded-lg font-medium hover:opacity-90`}>
              Перейти
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;