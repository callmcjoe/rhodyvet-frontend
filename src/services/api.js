import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  setup: (data) => api.post('/auth/setup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  resetPassword: (userId, data) => api.put(`/auth/reset-password/${userId}`, data),
};

// Staff API
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getOne: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  transfer: (id, data) => api.put(`/staff/${id}/transfer`, data),
  deactivate: (id) => api.delete(`/staff/${id}`),
  reactivate: (id) => api.put(`/staff/${id}/reactivate`),
};

// Product API
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  deactivate: (id) => api.delete(`/products/${id}`),
  reactivate: (id) => api.put(`/products/${id}/reactivate`),
  getLowStock: (params) => api.get('/products/low-stock', { params }),
};

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getOne: (id) => api.get(`/sales/${id}`),
  getByNumber: (saleNumber) => api.get(`/sales/number/${saleNumber}`),
  create: (data) => api.post('/sales', data),
  getMySummary: (params) => api.get('/sales/my-summary', { params }),
  // Discount requests
  requestDiscount: (data) => api.post('/sales/request-discount', data),
  getMyDiscountRequests: () => api.get('/sales/my-discount-requests'),
  getDiscountRequests: (params) => api.get('/sales/discount-requests', { params }),
  approveDiscount: (id) => api.put(`/sales/discount-requests/${id}/approve`),
  rejectDiscount: (id, data) => api.put(`/sales/discount-requests/${id}/reject`, data),
};

// Refund API
export const refundAPI = {
  getAll: (params) => api.get('/sales/refunds/all', { params }),
  getPending: () => api.get('/sales/refunds/pending'),
  getOne: (id) => api.get(`/sales/refunds/${id}`),
  create: (data) => api.post('/sales/refunds', data),
  approve: (id) => api.put(`/sales/refunds/${id}/approve`),
  reject: (id, data) => api.put(`/sales/refunds/${id}/reject`, data),
};

// Stock API
export const stockAPI = {
  getOverview: (params) => api.get('/stock', { params }),
  addStock: (productId, data) => api.post(`/stock/${productId}/add`, data),
  removeStock: (productId, data) => api.post(`/stock/${productId}/remove`, data),
  adjustStock: (productId, data) => api.post(`/stock/${productId}/adjust`, data),
  getProductLogs: (productId, params) => api.get(`/stock/${productId}/logs`, { params }),
  getAllLogs: (params) => api.get('/stock/logs', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getSalesReport: (params) => api.get('/dashboard/sales-report', { params }),
  getStaffPerformance: (params) => api.get('/dashboard/staff-performance', { params }),
  getLowStockAlerts: () => api.get('/dashboard/low-stock'),
  getRecentActivity: (params) => api.get('/dashboard/recent-activity', { params }),
  getRefundStats: (params) => api.get('/dashboard/refund-stats', { params }),
};

// Client API
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  deactivate: (id) => api.delete(`/clients/${id}`),
  reactivate: (id) => api.put(`/clients/${id}/reactivate`),
  search: (q) => api.get('/clients/search', { params: { q } }),
  addPet: (id, data) => api.post(`/clients/${id}/pets`, data),
  removePet: (id, petId) => api.delete(`/clients/${id}/pets/${petId}`),
};

// Treatment API
export const treatmentAPI = {
  getAll: (params) => api.get('/treatments', { params }),
  getOne: (id) => api.get(`/treatments/${id}`),
  create: (data) => api.post('/treatments', data),
  update: (id, data) => api.put(`/treatments/${id}`, data),
  cancel: (id) => api.put(`/treatments/${id}/cancel`),
  getByClient: (clientId, params) => api.get(`/treatments/client/${clientId}`, { params }),
  getStats: () => api.get('/treatments/stats'),
  getUpcoming: (params) => api.get('/treatments/upcoming', { params }),
};

// Chicken API
export const chickenAPI = {
  getStock: () => api.get('/chicken/stock'),
  getTransactions: (params) => api.get('/chicken/transactions', { params }),
  createPurchase: (data) => api.post('/chicken/purchase', data),
  createSale: (data) => api.post('/chicken/sale', data),
  getStats: () => api.get('/chicken/stats'),
};

export default api;
