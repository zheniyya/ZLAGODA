import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import debounce from 'lodash/debounce';

const parseErrorMessage = (err, defaultMessage) => {
  const detail = err.response?.data?.detail;
  
  // If it's an array of objects (FastAPI 422 Validation Error)
  if (Array.isArray(detail)) {
    return detail.map(e => {
      // Gets the specific field name that failed and the message
      const fieldName = e.loc[e.loc.length - 1]; 
      return `Помилка в полі "${fieldName}": ${e.msg}`;
    }).join(' | ');
  }
  
  // If it's a standard string error from your backend (e.g., 404 or 400)
  if (typeof detail === 'string') {
    return detail;
  }
  
  return defaultMessage;
};

const Products = () => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('store_products');

  const [storeProducts, setStoreProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Фільтри
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Модальні вікна
  const [isStoreProductModalOpen, setIsStoreProductModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const [viewingStoreProduct, setViewingStoreProduct] = useState(null);

  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Завантаження даних з урахуванням фільтрів (серверна фільтрація)
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;

      if (activeTab === 'store_products') {
        if (categoryFilter) params.category_id = categoryFilter;
        if (promoFilter !== '') params.promotional = promoFilter;
        const spData = await apiService.getStoreProducts(params);
        setStoreProducts(spData);
        // Для модалки потрібен повний список товарів (без фільтрів)
        const prods = await apiService.getProducts();
        setProducts(prods);
      } else if (activeTab === 'products') {
        if (categoryFilter) params.category_id = categoryFilter;
        const prodData = await apiService.getProducts(params);
        setProducts(prodData);
        const cats = await apiService.getCategories();
        setCategories(cats);
      } else if (activeTab === 'categories') {
        const cats = await apiService.getCategories();
        setCategories(cats);
      }
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, categoryFilter, promoFilter]);

  const debouncedLoad = useCallback(debounce(loadAllData, 300), [loadAllData]);

  useEffect(() => {
    debouncedLoad();
    return () => debouncedLoad.cancel();
  }, [debouncedLoad]);

  // Скидання фільтрів при зміні вкладки
  useEffect(() => {
    setSearchQuery('');
    setCategoryFilter('');
    setPromoFilter('');
  }, [activeTab]);

// --- CRUD: ТОВАРИ У МАГАЗИНІ ---
  const saveStoreProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) {
        await apiService.updateStoreProduct(editingItem.upc, {
          id_product: formData.id_product,
          selling_price: formData.selling_price,
          products_number: formData.products_number,
          promotional_product: formData.promotional_product || false
        });
      } else {
        await apiService.createStoreProduct({
          id_product: formData.id_product,
          selling_price: formData.selling_price,
          products_number: formData.products_number,
          promotional_product: formData.promotional_product || false
        });
      }
      setIsStoreProductModalOpen(false);
      loadAllData();
    } catch (err) {
      setErrorMsg(parseErrorMessage(err, 'Помилка збереження товару в магазині'));
    }
  };

  const deleteStoreProduct = async (upc) => {
    if (window.confirm('Видалити цей товар з магазину?')) {
      try {
        await apiService.deleteStoreProduct(upc);
        loadAllData();
      } catch (err) {
        const detail = err.response?.data?.detail || 'Помилка видалення товару з магазину.';
        alert(detail);
      }
    }
  };

// --- CRUD: ДОВІДНИК ТОВАРІВ ---
  // У функції saveProduct перед відправкою:
const saveProduct = async (e) => {
  e.preventDefault();
  setErrorMsg('');
  try {
    const payload = {
      ...formData,
      characteristics: formData.characteristics?.trim() || '—'   // <-- додано значення за замовчуванням
    };

    if (editingItem) await apiService.updateProduct(editingItem.id_product, payload);
    else await apiService.createProduct(payload);

    setIsProductModalOpen(false);
    loadAllData();
  } catch (err) {
    setErrorMsg(parseErrorMessage(err, 'Помилка збереження'));
  }
};

  const deleteProduct = async (id) => {
    if (window.confirm('Видалити товар з довідника?')) {
      try {
        await apiService.deleteProduct(id);
        loadAllData();
      } catch (err) {
        const detail = err.response?.data?.detail || 'Помилка видалення товару.';
        alert(detail);
      }
    }
  };

  // --- CRUD: КАТЕГОРІЇ ---
  const saveCategory = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingItem) await apiService.updateCategory(editingItem.category_number, formData);
      else await apiService.createCategory(formData);
      setIsCatModalOpen(false);
      loadAllData();
    } catch (err) {
      setErrorMsg(parseErrorMessage(err, 'Помилка збереження'));
    }
  };

  const deleteCategory = async (id) => {
    if (window.confirm('Видалити категорію?')) {
      try {
        await apiService.deleteCategory(id);
        loadAllData();
      } catch (err) {
        const detail = err.response?.data?.detail || 'Помилка видалення категорії.';
        alert(detail);
      }
    }
  };

  // --- Updated Checkbox Handler ---
  const handlePromoToggle = (e) => {
    const isPromo = e.target.checked;
    let newPrice = formData.selling_price;

    if (isPromo && formData.id_product) {
      const existingRegular = storeProducts.find(
        (sp) => sp.id_product === formData.id_product && !sp.promotional_product
      );
      if (existingRegular) {
        // Auto-calculate the 80% price
        newPrice = (parseFloat(existingRegular.selling_price) * 0.8).toFixed(2);
      } else {
        setErrorMsg("Спочатку додайте звичайний товар, щоб створити акційний.");
        return; // Prevent checking the box if no regular product exists
      }
    }

    setFormData({ 
      ...formData, 
      promotional_product: isPromo, 
      selling_price: newPrice 
    });
  };

  // --- Updated Product Select Handler ---
  const handleProductSelect = (e) => {
    const selectedIdProduct = Number(e.target.value);
    const existingRegular = storeProducts.find(
      (sp) => sp.id_product === selectedIdProduct && !sp.promotional_product
    );

    let newPrice = '';
    if (formData.promotional_product) {
        if (existingRegular) {
            newPrice = (parseFloat(existingRegular.selling_price) * 0.8).toFixed(2);
        }
    } else if (existingRegular) {
        newPrice = existingRegular.selling_price;
    }

    setFormData({ 
      ...formData, 
      id_product: selectedIdProduct, 
      selling_price: newPrice 
    });
  };

  const isManager = user?.role?.toLowerCase() === 'manager';

  const openAddModal = () => {
    setEditingItem(null);
    setErrorMsg('');
    if (activeTab === 'store_products') {
      setFormData({ promotional_product: false, products_number: 0, selling_price: '' });
      setIsStoreProductModalOpen(true);
    } else if (activeTab === 'products') {
      setFormData({});
      setIsProductModalOpen(true);
    } else {
      setFormData({});
      setIsCatModalOpen(true);
    }
  };

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-6">Управління Товарами</h2>

      {/* ТАБИ */}
      <div className="flex border-b mb-6 bg-white rounded-t-lg shadow-sm overflow-x-auto">
        {[
          { key: 'store_products', label: '🏪 Товари у магазині' },
          { key: 'products', label: '📦 Довідник Товарів' },
          { key: 'categories', label: '🗂️ Категорії' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-3 px-4 font-semibold text-center whitespace-nowrap ${activeTab === tab.key ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ПАНЕЛЬ ФІЛЬТРІВ ТА ПОШУКУ */}
      <div className="flex-1 flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="🔍 Пошук..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
        />
        {activeTab === 'store_products' && (
          <>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border-2 border-gray-200 p-3 rounded-lg"
            >
              <option value="">Всі категорії</option>
              {categories.map(c => (
                <option key={c.category_number} value={c.category_number}>{c.category_name}</option>
              ))}
            </select>
            <select
              value={promoFilter}
              onChange={e => setPromoFilter(e.target.value)}
              className="border-2 border-gray-200 p-3 rounded-lg"
            >
              <option value="">Всі товари</option>
              <option value="true">Тільки акційні</option>
              <option value="false">Тільки звичайні</option>
            </select>
          </>
        )}
        {activeTab === 'products' && (
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border-2 border-gray-200 p-3 rounded-lg"
          >
            <option value="">Всі категорії</option>
            {categories.map(c => (
              <option key={c.category_number} value={c.category_number}>{c.category_name}</option>
            ))}
          </select>
        )}
        {isManager && (
          <button
            onClick={openAddModal}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition whitespace-nowrap"
          >
            + Додати {activeTab === 'store_products' ? 'в магазин' : activeTab === 'products' ? 'товар' : 'категорію'}
          </button>
        )}
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Завантаження...</div>}

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
            {storeProducts.map(sp => (
              <tr key={`sp-${sp.upc}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{sp.upc}</td>
                <td className="p-3 font-semibold">
                  {sp.product_name || products.find(p => p.id_product === sp.id_product)?.product_name || '—'}
                </td>
                <td className="p-3 font-bold text-green-700">{Number(sp.selling_price).toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded font-bold ${sp.products_number < 10 ? 'bg-red-100 text-red-700' : 'text-gray-800'}`}>
                    {sp.products_number} шт.
                  </span>
                </td>
                <td className="p-3">{sp.promotional_product ? '🔥 Так' : 'Ні'}</td>
                <td className="p-3 text-right space-x-2">
                  {/* КНОПКА "ДЕТАЛІ" ДОСТУПНА ВСІМ */}
                  <button onClick={() => setViewingStoreProduct(sp)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Дет.</button>
                  {isManager && (
                    <>
                      <button onClick={() => { setEditingItem(sp); setFormData(sp); setErrorMsg(''); setIsStoreProductModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Ред.</button>
                      <button onClick={() => deleteStoreProduct(sp.upc)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Вид.</button>
                    </>
                  )}
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
              <th className="p-3">ID</th>
              <th className="p-3">Назва</th>
              <th className="p-3">Характеристики</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={`prod-${p.id_product}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{p.id_product}</td>
                <td className="p-3 font-semibold">{p.product_name}</td>
                <td className="p-3 text-sm text-gray-600">{p.characteristics}</td>
                <td className="p-3 text-right space-x-2">
                  {isManager && (
                    <>
                      <button onClick={() => { setEditingItem(p); setFormData(p); setErrorMsg(''); setIsProductModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Ред.</button>
                      <button onClick={() => deleteProduct(p.id_product)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Вид.</button>
                    </>
                  )}
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
              <th className="p-3">№</th>
              <th className="p-3">Назва категорії</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={`cat-${c.category_number}`} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-sm">{c.category_number}</td>
                <td className="p-3 font-semibold text-lg">{c.category_name}</td>
                <td className="p-3 text-right space-x-2">
                  {isManager && (
                    <>
                      <button onClick={() => { setEditingItem(c); setFormData(c); setErrorMsg(''); setIsCatModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Редагувати</button>
                      <button onClick={() => deleteCategory(c.category_number)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Видалити</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ========== МОДАЛЬНІ ВІКНА ========== */}

      {/* МОДАЛКА: ТОВАР У МАГАЗИНІ */}
      {isStoreProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редагувати партію' : 'Додати товар в магазин'}</h3>

            {errorMsg && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{errorMsg}</div>
            )}

            <form onSubmit={saveStoreProduct} className="space-y-4">
              <select
                required
                className="w-full border p-3 rounded-lg"
                value={formData.id_product || ''}
                onChange={handleProductSelect}
                disabled={!!editingItem}
              >
                <option value="" disabled>Оберіть товар з довідника...</option>
                {products.map(p => (
                  <option key={`opt-${p.id_product}`} value={p.id_product}>{p.product_name}</option>
                ))}
              </select>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Ціна продажу (₴):</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className={`w-full border p-3 rounded-lg ${formData.promotional_product ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  value={formData.selling_price || ''}
                  onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })}
                  disabled={formData.promotional_product} // Lock the input if it's on sale
                />
                {formData.promotional_product && (
                  <span className="text-xs text-blue-600 mt-1 block">
                    *Ціна автоматично розрахована (знижка 20%)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Кількість одиниць:</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full border p-3 rounded-lg"
                  value={formData.products_number ?? ''}
                  onChange={e => setFormData({ ...formData, products_number: parseInt(e.target.value) })}
                />
              </div>

              <label className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={formData.promotional_product || false}
                  onChange={handlePromoToggle}
                  disabled={!!editingItem} // Prevent changing product type during an edit
                />
                <span className="font-semibold text-gray-700">Акційний товар (знижка 20%)</span>
              </label>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsStoreProductModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Скасувати</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ДОВІДНИК ТОВАРІВ */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Редагувати товар' : 'Новий товар'}</h3>
            {errorMsg && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{errorMsg}</div>}
            <form onSubmit={saveProduct} className="space-y-4">
              <input required placeholder="Назва товару" className="w-full border p-3 rounded-lg" value={formData.product_name || ''} onChange={e => setFormData({ ...formData, product_name: e.target.value })} />
                         
              <select required className="w-full border p-3 rounded-lg" value={formData.category_number || ''} onChange={e => setFormData({ ...formData, category_number: Number(e.target.value) })}>
                <option value="" disabled>Оберіть категорію...</option>
                {categories.map(c => <option key={c.category_number} value={c.category_number}>{c.category_name}</option>)}
              </select>
<textarea
  placeholder="Характеристики"
  className="w-full border p-3 rounded-lg"
  value={formData.characteristics || ''}
  onChange={e => setFormData({ ...formData, characteristics: e.target.value })}
/>              <div className="flex justify-end space-x-3">
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
            {errorMsg && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{errorMsg}</div>}
            <form onSubmit={saveCategory} className="space-y-4">
              <input required placeholder="Назва категорії" className="w-full border p-3 rounded-lg" value={formData.category_name || ''} onChange={e => setFormData({ ...formData, category_name: e.target.value })} />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Скасувати</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== НОВЕ МОДАЛЬНЕ ВІКНО: ДЕТАЛІ ТОВАРУ ========== */}
      {viewingStoreProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-800">Деталі товару</h3>
              <button onClick={() => setViewingStoreProduct(null)} className="text-gray-400 hover:text-gray-700 font-bold text-2xl leading-none">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Назва товару</p>
                <p className="text-lg font-medium text-gray-900">
                  {viewingStoreProduct.product_name || products.find(p => p.id_product === viewingStoreProduct.id_product)?.product_name || '—'}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Характеристики</p>
                <p className="text-md text-gray-900">
                  {viewingStoreProduct.characteristics || products.find(p => p.id_product === viewingStoreProduct.id_product)?.characteristics || '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">UPC-код</p>
                  <p className="text-lg font-mono text-gray-900">{viewingStoreProduct.upc}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Тип</p>
                  <p className="text-lg font-medium text-gray-900">
                    {viewingStoreProduct.promotional_product ? '🔥 Акційний' : 'Звичайний'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ціна продажу</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Number(viewingStoreProduct.selling_price).toFixed(2)} ₴
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">В наявності</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {viewingStoreProduct.products_number} <span className="text-sm font-normal">шт.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setViewingStoreProduct(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;