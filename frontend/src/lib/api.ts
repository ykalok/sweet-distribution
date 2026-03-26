import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url?.startsWith('/auth/');
  if (!isAuthEndpoint) {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_profile');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; fullName: string; companyName?: string }) =>
    api.post('/auth/register', data),
};

// Products (public)
export const productApi = {
  getAll: (category?: string, page = 0, size = 20) =>
    api.get('/products', { params: { category: category || undefined, page, size } }),
  getById: (id: string) =>
    api.get(`/products/${id}`),
  search: (q: string, page = 0, size = 20) =>
    api.get('/products/search', { params: { q, page, size } }),
  getCategories: () =>
    api.get('/products/categories'),
};

// Cart
export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId: string, quantity: number) =>
    api.post('/cart', { productId, quantity }),
  updateQuantity: (itemId: string, quantity: number) =>
    api.put(`/cart/${itemId}`, null, { params: { quantity } }),
  remove: (itemId: string) =>
    api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

// Orders
export const orderApi = {
  create: (data: { deliveryAddress: string; notes?: string; items: { productId: string; quantity: number }[] }) =>
    api.post('/orders', data),
  getMyOrders: (page = 0, size = 20) =>
    api.get('/orders', { params: { page, size } }),
  getById: (id: string) =>
    api.get(`/orders/${id}`),
  cancel: (id: string) =>
    api.post(`/orders/${id}/cancel`),
  getTracking: (id: string) =>
    api.get(`/orders/${id}/track`),
};

// Payments
export const paymentApi = {
  createOrder: (orderId: string) =>
    api.post('/payments/create-order', { orderId }),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/payments/verify', data),
  getStatus: (orderId: string) =>
    api.get(`/payments/${orderId}`),
  getRazorpayKey: () =>
    api.get('/payments/razorpay-key'),
};

// Invoices
export const invoiceApi = {
  getByOrderId: (orderId: string) =>
    api.get(`/invoices/${orderId}`),
};

// Addresses
export const addressApi = {
  getAll: () => api.get('/addresses'),
  create: (data: { addressLine1: string; addressLine2?: string; label?: string; city: string; state: string; pincode: string; mobileNumber?: string; isDefault?: boolean }) =>
    api.post('/addresses', data),
  update: (id: string, data: { addressLine1: string; addressLine2?: string; label?: string; city: string; state: string; pincode: string; mobileNumber?: string; isDefault?: boolean }) =>
    api.put(`/addresses/${id}`, data),
  delete: (id: string) =>
    api.delete(`/addresses/${id}`),
};

// Admin
export const adminApi = {
  getProducts: (page = 0, size = 20) =>
    api.get('/admin/products', { params: { page, size } }),
  createProduct: (data: { name: string; description: string; price: number; category: string; imageUrl?: string; stockQuantity: number; minOrderQuantity: number; isActive?: boolean }) =>
    api.post('/admin/products', data),
  updateProduct: (id: string, data: { name: string; description: string; price: number; category: string; imageUrl?: string; stockQuantity: number; minOrderQuantity: number; isActive?: boolean }) =>
    api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) =>
    api.delete(`/admin/products/${id}`),
  getOrders: (status?: string, page = 0, size = 20) =>
    api.get('/admin/orders', { params: { status: status || undefined, page, size } }),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, null, { params: { status } }),
  generateInvoice: (orderId: string) =>
    api.post(`/admin/orders/${orderId}/invoice`),
  getTracking: (orderId: string) =>
    api.get(`/admin/orders/${orderId}/tracking`),
  addTracking: (orderId: string, status: string, location?: string, notes?: string) =>
    api.post(`/admin/orders/${orderId}/tracking`, null, { params: { status, location, notes } }),
};

export default api;
