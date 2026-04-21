import { useState } from 'react';
import { apiService } from '../../api/apiService';

const CreateCheck = () => {
  const [cart, setCart] = useState([]);
  const [upcInput, setUpcInput] = useState('');
  const [customerCardInput, setCustomerCardInput] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToCart = async (e) => {
    e.preventDefault();
    setError('');
    if (!upcInput.trim()) return;

    try {
      const product = await apiService.getStoreProductByUPC(upcInput.trim());

      if (product.products_number <= 0) {
        setError('Товару немає в наявності');
        return;
      }

      setCart(prev => {
        const existing = prev.find(item => item.upc === product.upc);
        if (existing) {
          if (existing.quantity >= product.products_number) {
            setError(`Перевищено доступну кількість: ${product.products_number} шт.`);
            return prev;
          }
          return prev.map(item =>
            item.upc === product.upc
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      setUpcInput('');
    } catch (err) {
      setError('Товар не знайдено за даним UPC');
    }
  };

  const changeQuantity = (upc, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.upc !== upc) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.products_number) {
            setError(`Максимальна кількість: ${item.products_number} шт.`);
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean); 
    });
  };

  const removeFromCart = (upc) => {
    setCart(prev => prev.filter(item => item.upc !== upc));
  };

  const applyCard = async () => {
    if (!customerCardInput.trim()) return;
    try {
      const customer = await apiService.getCustomerByCard(customerCardInput.trim());
      if (customer) {
        setCustomerInfo(customer);
        setError('');
      } else {
        setError('Карту не знайдено');
        setCustomerInfo(null);
      }
    } catch (err) {
      setError('Помилка пошуку карти');
    }
  };

  const removeCard = () => {
    setCustomerInfo(null);
    setCustomerCardInput('');
  };

  const calculateTotals = () => {
    const rawSum = cart.reduce(
      (acc, item) => acc + parseFloat(item.selling_price) * item.quantity,
      0
    );
    const discountPercent = customerInfo ? customerInfo.percent : 0;
    const discountAmount = rawSum * (discountPercent / 100);
    const totalSum = rawSum - discountAmount;
    const vat = totalSum * 0.2;
    return { rawSum, discountAmount, totalSum, vat, discountPercent };
  };

  const submitCheck = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setError('');
    
    const payload = {
      card_number: customerInfo?.card_number || null,
      items: cart.map(item => ({
        upc: item.upc,
        product_number: item.quantity,
      })),
    };

    try {
      const result = await apiService.createCheck(payload);
      alert(`✅ Чек №${result.check_number} успішно фіскалізовано!\nСума: ${result.sum_total} ₴`);
      setCart([]);
      setCustomerInfo(null);
      setCustomerCardInput('');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Помилка збереження чеку';
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Каса: Новий продаж</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── КОШИК ── */}
        <div className="lg:col-span-2 bg-white p-4 rounded shadow-sm">
          <form onSubmit={addToCart} className="flex gap-2 mb-4">
            <input
              autoFocus
              className="border p-2 rounded flex-1"
              value={upcInput}
              onChange={e => setUpcInput(e.target.value)}
              placeholder="Сканувати UPC товару..."
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Додати
            </button>
          </form>

          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Кошик порожній</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2">Назва</th>
                  <th className="p-2">UPC</th>
                  <th className="p-2 text-right">Ціна (₴)</th>
                  <th className="p-2 text-center">К-сть</th>
                  <th className="p-2 text-right">Сума (₴)</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr
                    key={item.upc}
                    className={`border-b ${item.promotional_product ? 'bg-orange-50' : ''}`}
                  >
                    <td className="p-2 text-sm">
                      {item.product_name || '—'}{' '}
                      {item.promotional_product && <span title="Акційний">🔥</span>}
                    </td>
                    <td className="p-2 text-xs text-gray-500 font-mono">{item.upc}</td>
                    <td className="p-2 text-right">{parseFloat(item.selling_price).toFixed(2)}</td>

                    {/* ВИПРАВЛЕННЯ №11: кнопки − / + та видалення */}
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => changeQuantity(item.upc, -1)}
                          className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => changeQuantity(item.upc, +1)}
                          className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-2 text-right font-semibold">
                      {(parseFloat(item.selling_price) * item.quantity).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => removeFromCart(item.upc)}
                        className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
                        title="Видалити позицію"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── ПІДСУМОК ── */}
        <div className="bg-gray-800 text-white p-6 rounded shadow-md flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Підсумок</h3>

          {/* Карта клієнта */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Карта клієнта</label>
            {customerInfo ? (
              <div className="bg-green-800 rounded p-2 flex justify-between items-center">
                <span className="text-green-300 text-sm">
                  {customerInfo.cust_surname} {customerInfo.cust_name}
                  <br />
                  <span className="font-bold">Знижка: {customerInfo.percent}%</span>
                </span>
                <button
                  onClick={removeCard}
                  className="text-gray-400 hover:text-white ml-2"
                  title="Прибрати карту"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="text-black border p-2 rounded w-full"
                  value={customerCardInput}
                  onChange={e => setCustomerCardInput(e.target.value)}
                  placeholder="Номер карти"
                  onKeyDown={e => e.key === 'Enter' && applyCard()}
                />
                <button
                  onClick={applyCard}
                  className="bg-slate-600 px-3 py-2 rounded hover:bg-slate-500"
                >
                  ОК
                </button>
              </div>
            )}
          </div>

          {/* Розрахунок (попередній, на фронті) */}
          <div className="mt-auto space-y-2 border-t border-slate-600 pt-4 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Сума без знижки:</span>
              <span>{totals.rawSum.toFixed(2)} ₴</span>
            </div>
            {totals.discountPercent > 0 && (
              <div className="flex justify-between text-orange-300">
                <span>Знижка ({totals.discountPercent}%):</span>
                <span>−{totals.discountAmount.toFixed(2)} ₴</span>
              </div>
            )}
            <div className="flex justify-between text-gray-300">
              <span>ПДВ (20%):</span>
              <span>{totals.vat.toFixed(2)} ₴</span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-3 border-t border-slate-600">
              <span>До сплати:</span>
              <span className="text-green-400">{totals.totalSum.toFixed(2)} ₴</span>
            </div>
            <p className="text-xs text-gray-500 text-center pt-1">
              * Кінцева сума розраховується сервером
            </p>
          </div>

          <button
            onClick={submitCheck}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-3 px-4 rounded mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Збереження...' : 'Фіскалізувати чек'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCheck;
