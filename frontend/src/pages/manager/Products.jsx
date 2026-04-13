import { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';

const Products = () => {
  const { user } = useContext(AuthContext);
  // Тепер у нас 3 вкладки: store_products, products, categories
  const [activeTab, setActiveTab] = useState('store_products'); 
  
  // Дані
  const [storeProducts, setStoreProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Пошук
  const [searchQuery, setSearchQuery] = useState('');
  
  // Модальні вікна
  const [isStoreProductModalOpen, setIsStoreProductModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  // Форми
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    try {
      // Завантажуємо всі довідники одразу, щоб випадаючі списки працювали коректно
      if (activeTab === 'store_products') {
        setStoreProducts(await apiService.getStoreProducts());
        setProducts(await apiService.getProducts()); // Потрібно для селекта
      } else if (activeTab === 'products') {
        setProducts(await apiService.getProducts());
        setCategories(await apiService.getCategories()); // Потрібно для селекта
      } else if (activeTab === 'categories') {
        setCategories(await apiService.getCategories());
      }
    } catch (error) {
      console.error("Помилка завантаження даних:", error);
    }
  };

  // --- ФІЛЬТРАЦІЯ ---
  const filteredStoreProducts = useMemo(() => {
    return storeProducts.filter(sp => 
      sp.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      sp.upc?.includes(searchQuery)
    );
  }, [storeProducts, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  // --- CRUD: ТОВАРИ У МАГАЗИНІ ---
  const saveStoreProduct = async (e) => {
    e.preventDefault();
    if (editingItem) await apiService.updateStoreProduct(editingItem.upc, formData);
    else await apiService.createStoreProduct(formData);
    setIsStoreProductModalOpen(false);
    loadAllData();
  };

  const deleteStoreProduct = async (upc) => {
    if (window.confirm("Видалити цей товар з магазину?")) {
      await apiService.deleteStoreProduct(upc);
      loadAllData();
    }
  };

  // --- CRUD: ДОВІДНИК ТОВАРІВ ---
  const saveProduct = async (e) => {
    e.preventDefault();
    if (editingItem) await apiService.updateProduct(editingItem.id_product, formData);
    else await apiService.createProduct(formData);
    setIsProductModalOpen(false);
    loadAllData();
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Видалити товар з довідника? Це неможливо, якщо він є у магазині.")) {
      await apiService.deleteProduct(id);
      loadAllData();
    }
  };

  // --- CRUD: КАТЕГОРІЇ ---
  const saveCategory = async (e) => {
    e.preventDefault();
    if (editingItem) await apiService.updateCategory(editingItem.category_number, formData);
    else await apiService.createCategory(formData);
    setIsCatModalOpen(false);
    loadAllData();
  };

  const deleteCategory = async (id) => {
    if (window.confirm("Видалити категорію?")) {
      await apiService.deleteCategory(id);
      loadAllData();
    }
  };

  const handleProductSelect = (e) => {
    const selectedIdProduct = Number(e.target.value);
    
    // Шукаємо, чи є вже такий товар на полицях (бажано не акційний)
    const existingRegularProduct = storeProducts.find(
      sp => sp.id_product === selectedIdProduct && !sp.promotional_product
    );
    // Якщо є тільки акційний, беремо його і вираховуємо повну ціну (ділимо на 0.8)
    const existingPromoProduct = storeProducts.find(
      sp => sp.id_product === selectedIdProduct && sp.promotional_product
    );

    let oldPrice = '';
    if (existingRegularProduct) {
      oldPrice = existingRegularProduct.selling_price;
    } else if (existingPromoProduct) {
      oldPrice = (existingPromoProduct.selling_price / 0.8).toFixed(2);
    }

    setFormData({
      ...formData, 
      id_product: selectedIdProduct,
      selling_price: oldPrice // Підставляємо стару ціну одразу
    });
  };

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-6">Управління Товарами</h2>

      {/* ТАБИ */}
      <div className="flex border-b mb-6 bg-white rounded-t-lg shadow-sm overflow-x-auto">
        <button 
          className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap ${activeTab === 'store_products' ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => { setActiveTab('store_products'); setSearchQuery(''); }}
        >
          🏪 Товари у магазині
        </button>
        <button 
          className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap ${activeTab === 'products' ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
        >
          📦 Довідник Товарів
        </button>
        <button 
          className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap ${activeTab === 'categories' ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
        >
          🗂️ Категорії
        </button>
      </div>

      {/* ПАНЕЛЬ ПОШУКУ ТА ДОДАВАННЯ */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <input 
          type="text" 
          placeholder="🔍 Пошук..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition text-lg"
        />
        {user?.role === 'manager' && (
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData(activeTab === 'store_products' ? { promotional_product: false, products_number: 0 } : {});
              if (activeTab === 'store_products') setIsStoreProductModalOpen(true);
              else if (activeTab === 'products') setIsProductModalOpen(true);
              else setIsCatModalOpen(true);
            }} 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition whitespace-nowrap"
          >
            + Додати {activeTab === 'store_products' ? 'в магазин' : activeTab === 'products' ? 'товар' : 'категорію'}
          </button>
        )}
      </div>

      {/* ТАБЛИЦЯ: ТОВАРИ У МАГАЗИНІ */}
      {activeTab === 'store_products' && (
        <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">UPC</th>
              <th className="p-3">Назва товару</th>
              <th className="p-3">Ціна (₴)</th>
              <th className="p-3">Кількість</th>
              <th className="p-3">Акція</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredStoreProducts.map(sp => (
              <tr key={`sp-${sp.upc}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{sp.upc}</td>
                <td className="p-3 font-semibold">
                  {products.find(p => p.id_product === sp.id_product)?.product_name || `Завантаження...`}
                </td>
                <td className="p-3 font-bold text-green-700">{Number(sp.selling_price).toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded font-bold ${sp.products_number < 10 ? 'bg-red-100 text-red-700' : 'text-gray-800'}`}>
                    {sp.products_number} шт.
                  </span>
                </td>
                <td className="p-3">{sp.promotional_product ? '🔥 Так' : 'Ні'}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(sp); setFormData(sp); setIsStoreProductModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Ред.</button>
                  <button onClick={() => deleteStoreProduct(sp.upc)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Вид.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ТАБЛИЦЯ: ДОВІДНИК ТОВАРІВ */}
      {activeTab === 'products' && (
        <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">ID Товар</th>
              <th className="p-3">Назва</th>
              <th className="p-3">Характеристики</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={`prod-${p.id_product}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{p.id_product}</td>
                <td className="p-3 font-semibold">{p.product_name}</td>
                <td className="p-3 text-sm text-gray-600">{p.characteristics}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(p); setFormData(p); setIsProductModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Ред.</button>
                  <button onClick={() => deleteProduct(p.id_product)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Вид.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ТАБЛИЦЯ: КАТЕГОРІЇ */}
      {activeTab === 'categories' && (
        <table className="w-full bg-white rounded shadow-sm text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">№ Категорії</th>
              <th className="p-3 w-1/2">Назва категорії</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map(c => (
              <tr key={`cat-${c.category_number}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{c.category_number}</td>
                <td className="p-3 font-semibold text-lg">{c.category_name}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(c); setFormData(c); setIsCatModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded">Редагувати</button>
                  <button onClick={() => deleteCategory(c.category_number)} className="bg-red-600 text-white px-3 py-1 rounded">Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* МОДАЛКА: ТОВАР У МАГАЗИНІ */}
      {isStoreProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редагувати партію' : 'Додати товар в магазин'}</h3>
            <form onSubmit={saveStoreProduct} className="space-y-4">
              
              <select required className="w-full border p-3 rounded-lg" value={formData.id_product || ''} onChange={handleProductSelect}>
                <option value="" disabled>Оберіть базовий товар з довідника...</option>
                {/* Виводимо назву товару як рядок у селекті */}
                {products.map(p => <option key={`opt-prod-${p.id_product}`} value={p.id_product}>{p.product_name}</option>)}
              </select>

              <div className="relative">
                <label className="block text-sm text-gray-600 mb-1">
                  {formData.selling_price ? 'Стара ціна знайдена (змініть для переоцінки):' : 'Ціна продажу (₴):'}
                </label>
                <input required type="number" step="0.01" min="0" placeholder="0.00" className={`w-full border p-3 rounded-lg ${formData.selling_price ? 'bg-yellow-50 border-yellow-400' : ''}`} value={formData.selling_price || ''} onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value)})} />
              </div>
              
              <label>Кількість одиниць</label>
              <input required type="number" min="0" placeholder="Кількість одиниць" className="w-full border p-3 rounded-lg" value={formData.products_number ?? ''} onChange={e => setFormData({...formData, products_number: parseInt(e.target.value)})} />
              
              <label className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50">
                <input type="checkbox" className="w-5 h-5 text-blue-600" checked={formData.promotional_product || false} onChange={e => setFormData({...formData, promotional_product: e.target.checked})} />
                <span className="font-semibold text-gray-700">Акційний товар (Знижка 20%)</span>
              </label>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsStoreProductModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Скасувати</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ДОВІДНИК ТОВАРІВ (PRODUCT) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редагувати базовий товар' : 'Новий товар (Довідник)'}</h3>
            <form onSubmit={saveProduct} className="space-y-4">
              <input required placeholder="Назва товару" className="w-full border p-3 rounded-lg" value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
              
              <select required className="w-full border p-3 rounded-lg" value={formData.category_number || ''} onChange={e => setFormData({...formData, category_number: e.target.value})}>
                <option value="" disabled>Оберіть категорію...</option>
                {categories.map(c => <option key={`opt-cat-${c.category_number}`} value={c.category_number}>{c.category_name}</option>)}
              </select>
              
              <textarea placeholder="Характеристики (Виробник, вага тощо)" className="w-full border p-3 rounded-lg" value={formData.characteristics || ''} onChange={e => setFormData({...formData, characteristics: e.target.value})} />
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Скасувати</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: КАТЕГОРІЯ */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редагувати категорію' : 'Нова категорія'}</h3>
            <form onSubmit={saveCategory} className="space-y-4">
              <input required placeholder="Назва категорії" className="w-full border p-3 rounded-lg" value={formData.category_name || ''} onChange={e => setFormData({...formData, category_name: e.target.value})} />
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Скасувати</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;