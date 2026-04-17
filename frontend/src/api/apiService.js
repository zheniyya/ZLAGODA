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
        return { token: "fake_manager_jwt", user: { role: 'Manager', id: 'manager_1' } };
      }
      if (username === 'cashier' && password === '123') {
        return { token: "fake_cashier_jwt", user: { role: 'Cashier', id: 'cashier_1' } };
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

  // --- EMPLOYEES ---
  getEmployees: async () => {
    if (USE_MOCK) {
      await delay(200);
      return [...mockDb.mockEmployees];
    }
    const res = await axiosClient.get('/employees/');
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

  // --- PRODUCTS (довідник) ---
  getProducts: async () => {
    if (USE_MOCK) {
      await delay(200);
      return [...mockDb.mockProducts];
    }
    const res = await axiosClient.get('/products/');
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

  // --- STORE PRODUCTS ---
  getStoreProducts: async () => {
    if (USE_MOCK) {
      await delay(200);
      return mockDb.mockStoreProducts.map(sp => {
        const prod = mockDb.mockProducts.find(p => p.id_product === sp.id_product);
        const cat = mockDb.mockCategories.find(c => c.category_number === prod?.category_number);
        return { ...sp, product_name: prod?.product_name, category_name: cat?.category_name };
      });
    }
    const res = await axiosClient.get('/store_products/');
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

  // --- CUSTOMERS ---
  getCustomers: async () => {
    if (USE_MOCK) {
      await delay(200);
      return [...mockDb.mockCustomers];
    }
    const res = await axiosClient.get('/customer_cards/');
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

  // --- CHECKS ---
  getChecks: async () => {
    if (USE_MOCK) {
      await delay(200);
      return [...mockDb.mockChecks];
    }
    const res = await axiosClient.get('/checks/');
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
};