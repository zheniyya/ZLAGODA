import { useState } from 'react';
import { apiService } from '../../api/apiService';

const CreateCheck = () => {
  const [cart, setCart] = useState([]);
  const [upcInput, setUpcInput] = useState('');
  const [customerCardInput, setCustomerCardInput] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [error, setError] = useState('');

  const addToCart = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const product = await apiService.getStoreProductByUPC(upcInput);
      
      if (product.products_number <= 0) {
        setError('Товару немає в наявності');
        return;
      }

      setCart(prev => {
        const existing = prev.find(item => item.upc === product.upc);
        if (existing) {
            // Check stock limits
            if (existing.quantity >= product.products_number) {
                setError('Перевищено доступну кількість товару');
                return prev;
            }
            return prev.map(item => 
                item.upc === product.upc ? { ...item, quantity: item.quantity + 1 } : item
            );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      setUpcInput('');
    } catch (err) {
      setError('Товар не знайдено за даним UPC');
    }
  };

  const applyCard = async () => {
    try {
        const customer = await apiService.getCustomerByCard(customerCardInput);
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

  const calculateTotals = () => {
    const rawSum = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    const discountMultiplier = customerInfo ? (1 - (customerInfo.percent / 100)) : 1;
    const totalSum = rawSum * discountMultiplier;
    const vat = totalSum * 0.2; // ПДВ 20%
    
    return { rawSum, totalSum, vat };
  };

  const submitCheck = async () => {
    if (cart.length === 0) return;
    const { totalSum, vat } = calculateTotals();
    
    const payload = {
      card_number: customerInfo?.card_number || null,
      sum_total: Number(totalSum.toFixed(4)),
      vat: Number(vat.toFixed(4)),
      items: cart.map(item => ({ 
          upc: item.upc, 
          product_number: item.quantity, 
          selling_price: item.selling_price 
      }))
    };

    try {
        await apiService.createCheck(payload);
        alert('Чек успішно фіскалізовано!');
        setCart([]);
        setCustomerInfo(null);
        setCustomerCardInput('');
    } catch (err) {
        alert('Помилка збереження чеку');
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Каса: Новий продаж</h2>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded shadow-sm">
          <form onSubmit={addToCart} className="flex gap-2 mb-4">
            <input 
              autoFocus
              className="border p-2 rounded flex-1"
              value={upcInput} 
              onChange={e => setUpcInput(e.target.value)} 
              placeholder="Сканувати UPC товару..." 
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Додати
            </button>
          </form>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2">Назва</th>
                <th className="p-2">UPC</th>
                <th className="p-2">Ціна (₴)</th>
                <th className="p-2">К-сть</th>
                <th className="p-2">Сума (₴)</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.upc} className={`border-b ${item.promotional_product ? 'bg-orange-50' : ''}`}>
                  <td className="p-2">{item.product_name} {item.promotional_product && '🔥'}</td>
                  <td className="p-2 text-sm text-gray-500 font-mono">{item.upc}</td>
                  <td className="p-2">{item.selling_price.toFixed(2)}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2 font-semibold">{(item.selling_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SUMMARY PANEL */}
        <div className="bg-gray-800 text-white p-6 rounded shadow-md flex flex-col h-full">
          <h3 className="text-xl font-semibold mb-4">Підсумок</h3>
          
          <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Карта клієнта</label>
              <div className="flex gap-2">
                <input 
                    className="text-black border p-2 rounded w-full"
                    value={customerCardInput} 
                    onChange={e => setCustomerCardInput(e.target.value)} 
                    placeholder="Номер карти" 
                />
                <button onClick={applyCard} className="bg-slate-600 px-3 py-2 rounded">Застосувати</button>
              </div>
              {customerInfo && (
                  <p className="text-green-400 text-sm mt-2">
                      Активна карта: {customerInfo.cust_surname} (-{customerInfo.percent}%)
                  </p>
              )}
          </div>

          <div className="mt-auto space-y-2 border-t border-slate-600 pt-4">
              <div className="flex justify-between text-gray-300">
                  <span>Сума без знижки:</span>
                  <span>{totals.rawSum.toFixed(2)} ₴</span>
              </div>
              <div className="flex justify-between text-gray-300">
                  <span>ПДВ (20% від підсумку):</span>
                  <span>{totals.vat.toFixed(2)} ₴</span>
              </div>
              <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t border-slate-600">
                  <span>До сплати:</span>
                  <span className="text-green-400">{totals.totalSum.toFixed(2)} ₴</span>
              </div>
          </div>

          <button 
            onClick={submitCheck} 
            disabled={cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-3 px-4 rounded mt-6 disabled:opacity-50"
          >
            Фіскалізувати чек
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCheck;