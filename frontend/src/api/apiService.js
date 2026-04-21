import axiosClient from './axiosClient';
import * as mockDb from '../data/mockData';

const USE_MOCK = false;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // --- AUTH ---
  login: async (credentials) => {
    if (USE_MOCK) {
      await delay(300);
      const { username, password } = credentials;
      if (username === 'manager' && password === '123') {
        return { token: "fake_manager_jwt", user: { role: 'manager', id: 'manager_1' } };
      }
      if (username === 'cashier' && password === '123') {
        return { token: "fake_cashier_jwt", user: { role: 'cashier', id: 'cashier_1' } };
      }
      throw new Error("Невірний логін або пароль");
    }

    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    const res = await axiosClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },

  // --- EMPLOYEES (з серверним пошуком) ---
  getEmployees: async (params = {}) => {
    if (USE_MOCK) {
      await delay(200);
      let result = [...mockDb.mockEmployees];
      if (params.search) {
        result = result.filter(e =>
          e.empl_surname.toLowerCase().includes(params.search.toLowerCase())
        );
      }
      if (params.role) {
        result = result.filter(e => e.empl_role === params.role);
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    const res = await axiosClient.get(`/employees/?${query.toString()}`);
    return res.data;
  },

  getProfile: async (id) => {
    if (USE_MOCK) {
      await delay(100);
      return mockDb.mockEmployees.find(e => e.id_employee === id);
    }
    const res = await axiosClient.get(`/employees/${id}`);
    return res.data;
  },

  deleteEmployee: async (id) => {
    if (USE_MOCK) {
      await delay(300);
      return { success: true };
    }
    return await axiosClient.delete(`/employees/${id}`);
  },

  createEmployee: async (data) => {
    if (USE_MOCK) {
      await delay(300);
      return { ...data, id_employee: `emp_${Date.now()}` };
    }
    return (await axiosClient.post('/employees/', data)).data;
  },

  updateEmployee: async (id, data) => {
    if (USE_MOCK) {
      await delay(300);
      return data;
    }
    return (await axiosClient.put(`/employees/${id}`, data)).data;
  },

  // --- PRODUCTS (довідник) з серверним пошуком ---
  getProducts: async (params = {}) => {
    if (USE_MOCK) {
      await delay(200);
      let result = [...mockDb.mockProducts];
      if (params.search) {
        result = result.filter(p =>
          p.product_name.toLowerCase().includes(params.search.toLowerCase())
        );
      }
      if (params.category_id) {
        result = result.filter(p => p.category_number === parseInt(params.category_id));
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category_id) query.append('category_id', params.category_id);
    const res = await axiosClient.get(`/products/?${query.toString()}`);
    return res.data;
  },

  getProductById: async (id) => {
    if (USE_MOCK) {
      await delay(100);
      return mockDb.mockProducts.find(p => p.id_product === id);
    }
    const res = await axiosClient.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (data) => {
    if (USE_MOCK) {
      await delay(300);
      return data;
    }
    return (await axiosClient.post('/products/', data)).data;
  },

  updateProduct: async (id, data) => {
    if (USE_MOCK) {
      await delay(300);
      return data;
    }
    return (await axiosClient.put(`/products/${id}`, data)).data;
  },

  deleteProduct: async (id) => {
    if (USE_MOCK) {
      await delay(300);
      return { success: true };
    }
    return await axiosClient.delete(`/products/${id}`);
  },

  // --- STORE PRODUCTS з серверним пошуком ---
  getStoreProducts: async (params = {}) => {
    if (USE_MOCK) {
      await delay(200);
      let result = mockDb.mockStoreProducts.map(sp => {
        const prod = mockDb.mockProducts.find(p => p.id_product === sp.id_product);
        const cat = mockDb.mockCategories.find(c => c.category_number === prod?.category_number);
        return { ...sp, product_name: prod?.product_name, category_name: cat?.category_name };
      });
      if (params.search) {
        result = result.filter(sp =>
          sp.upc.includes(params.search) ||
          sp.product_name?.toLowerCase().includes(params.search.toLowerCase())
        );
      }
      if (params.category_id) {
        result = result.filter(sp => {
          const prod = mockDb.mockProducts.find(p => p.id_product === sp.id_product);
          return prod?.category_number === parseInt(params.category_id);
        });
      }
      if (params.promotional !== undefined) {
        result = result.filter(sp => sp.promotional_product === (params.promotional === 'true'));
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.promotional !== undefined && params.promotional !== '') {
      query.append('promotional', params.promotional);
    }
    const res = await axiosClient.get(`/store_products/?${query.toString()}`);
    return res.data;
  },

  getStoreProductByUPC: async (upc) => {
    if (USE_MOCK) {
      await delay(100);
      const sp = mockDb.mockStoreProducts.find(p => p.upc === upc);
      if (!sp) throw new Error("Product not found");
      const prod = mockDb.mockProducts.find(p => p.id_product === sp.id_product);
      return { ...sp, product_name: prod?.product_name };
    }
    const res = await axiosClient.get(`/store_products/${upc}`);
    return res.data;
  },

  createStoreProduct: async (data) => {
    if (USE_MOCK) {
      await delay(300);
      return data;
    }
    return (await axiosClient.post('/store_products/', data)).data;
  },

  updateStoreProduct: async (upc, data) => {
    if (USE_MOCK) {
      await delay(300);
      return data;
    }
    return (await axiosClient.put(`/store_products/${upc}`, data)).data;
  },

  deleteStoreProduct: async (upc) => {
    if (USE_MOCK) {
      await delay(300);
      return { success: true };
    }
    return await axiosClient.delete(`/store_products/${upc}`);
  },

  // --- CATEGORIES ---
  getCategories: async () => {
    if (USE_MOCK) return [...mockDb.mockCategories];
    const res = await axiosClient.get('/categories/');
    return res.data;
  },

  createCategory: async (data) => {
    if (USE_MOCK) return data;
    return (await axiosClient.post('/categories/', data)).data;
  },

  updateCategory: async (id, data) => {
    if (USE_MOCK) return data;
    return (await axiosClient.put(`/categories/${id}`, data)).data;
  },

  deleteCategory: async (id) => {
    if (USE_MOCK) return { success: true };
    return await axiosClient.delete(`/categories/${id}`);
  },

  // --- CUSTOMERS з серверним пошуком ---
  getCustomers: async (params = {}) => {
    if (USE_MOCK) {
      await delay(200);
      let result = [...mockDb.mockCustomers];
      if (params.search) {
        result = result.filter(c =>
          c.cust_surname.toLowerCase().includes(params.search.toLowerCase()) ||
          c.card_number.includes(params.search)
        );
      }
      if (params.min_discount) {
        result = result.filter(c => c.percent >= parseInt(params.min_discount));
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.min_discount) query.append('min_discount', params.min_discount);
    const res = await axiosClient.get(`/customer_cards/?${query.toString()}`);
    return res.data;
  },

  getCustomerByCard: async (cardNumber) => {
    if (USE_MOCK) {
      await delay(100);
      return mockDb.mockCustomers.find(c => c.card_number === cardNumber) || null;
    }
    const res = await axiosClient.get(`/customer_cards/${cardNumber}`);
    return res.data;
  },

  createCustomer: async (data) => {
    if (USE_MOCK) {
      await delay(300);
      return { ...data, card_number: `CARD${Date.now().toString().slice(-4)}` };
    }
    return (await axiosClient.post('/customer_cards/', data)).data;
  },

  updateCustomer: async (id, data) => {
    if (USE_MOCK) {
      await delay(300);
      return data;
    }
    return (await axiosClient.put(`/customer_cards/${id}`, data)).data;
  },

  deleteCustomer: async (id) => {
    if (USE_MOCK) {
      await delay(300);
      return { success: true };
    }
    return await axiosClient.delete(`/customer_cards/${id}`);
  },

  // --- CHECKS з серверною фільтрацією ---
  getChecks: async (params = {}) => {
    if (USE_MOCK) {
      await delay(200);
      let result = [...mockDb.mockChecks];
      if (params.cashier_id) {
        result = result.filter(c => c.id_employee === params.cashier_id);
      }
      if (params.start_date) {
        result = result.filter(c => new Date(c.print_date) >= new Date(params.start_date));
      }
      if (params.end_date) {
        const end = new Date(params.end_date);
        end.setDate(end.getDate() + 1);
        result = result.filter(c => new Date(c.print_date) < end);
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params.cashier_id) query.append('cashier_id', params.cashier_id);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    const res = await axiosClient.get(`/checks/?${query.toString()}`);
    return res.data;
  },

  getCheckDetails: async (checkNumber) => {
    if (USE_MOCK) {
      await delay(100);
      return [
        { name: 'Молоко 2.5%', qty: 2, price: 28.40 },
        { name: 'Батон', qty: 1, price: 20.00 }
      ];
    }
    const res = await axiosClient.get(`/checks/${checkNumber}/items`);
    return res.data;
  },

  createCheck: async (checkData) => {
    if (USE_MOCK) {
      await delay(300);
      console.log("Mock Check Saved:", checkData);
      return { status: 'success', check_number: `CH-${Date.now()}` };
    }
    const res = await axiosClient.post('/checks/', checkData);
    return res.data;
  },

  deleteCheck: async (id) => {
    if (USE_MOCK) return { success: true };
    return await axiosClient.delete(`/checks/${id}`);
  },
  // В кінці об'єкта apiService додати:
  // --- АНАЛІТИКА ДЛЯ МЕНЕДЖЕРА ---
  getCustomerSummary: async () => {
    const res = await axiosClient.get('/analytics/customer-summary');
    return res.data;
  },

  getSalesByCategoryMonth: async () => {
    const res = await axiosClient.get('/analytics/sales-by-category-month');
    return res.data;
  },

  getPromoNeverSold: async () => {
    const res = await axiosClient.get('/analytics/promo-never-sold');
    return res.data;
  },

  getNotSoldForDays: async (days) => {
    const res = await axiosClient.get('/analytics/not-sold-days', { params: { days } });
    return res.data;
  },
};