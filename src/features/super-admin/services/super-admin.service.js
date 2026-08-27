import { api } from "@/services/api";

// Fetch School Meta (plans, document types, gateways, features)
export const getSchoolMeta = async () => {
  const response = await api.get("/super-admin/schools/meta");
  return response.data;
};

// Fetch School List (search + filters + pagination)
export const getSchools = async (params = {}) => {
  const response = await api.get("/super-admin/schools", { params });
  return response.data;
};

// Create a new School (Multipart / Form Data supported)
export const createSchool = async (payload) => {
  const response = await api.post("/super-admin/schools", payload);
  return response.data;
};

// Get School Details
export const getSchoolDetails = async (schoolId) => {
  const response = await api.get(`/super-admin/schools/${schoolId}`);
  return response.data;
};

// Update School Details (Multipart / Form Data supported)
export const updateSchool = async (schoolId, payload) => {
  const response = await api.post(`/super-admin/schools/${schoolId}`, payload);
  return response.data;
};

// Toggle School Active / Inactive status
export const toggleSchoolStatus = async (schoolId) => {
  const response = await api.post(`/super-admin/schools/${schoolId}/toggle-status`);
  return response.data;
};

// Soft Delete a School
export const deleteSchool = async (schoolId) => {
  const response = await api.delete(`/super-admin/schools/${schoolId}`);
  return response.data;
};

// Provision School Admin user login details
export const provisionSchoolAdmin = async (schoolId) => {
  const response = await api.post(`/super-admin/schools/${schoolId}/create-admin`);
  return response.data;
};

// Get Integrations config for a School
export const getSchoolIntegrations = async (schoolId) => {
  const response = await api.get(`/super-admin/schools/${schoolId}/integrations`);
  return response.data;
};

// Update Integrations config for a School
export const updateSchoolIntegrations = async (schoolId, payload) => {
  const response = await api.post(`/super-admin/schools/${schoolId}/integrations`, payload);
  return response.data;
};

// Get Features checklist + subscription status
export const getSchoolFeatures = async (schoolId) => {
  const response = await api.get(`/super-admin/schools/${schoolId}/features`);
  return response.data;
};

// Update enabled features for a School
export const updateSchoolFeatures = async (schoolId, payload) => {
  const response = await api.post(`/super-admin/schools/${schoolId}/features`, payload);
  return response.data;
};

// Renew subscription plan and ends date
export const renewSchoolSubscription = async (schoolId, payload) => {
  const response = await api.post(`/super-admin/schools/${schoolId}/features/renew`, payload);
  return response.data;
};

// Get school documents
export const getSchoolDocuments = async (schoolId) => {
  const response = await api.get(`/super-admin/schools/${schoolId}/documents`);
  return response.data;
};

// Upload school documents
export const uploadSchoolDocuments = async (schoolId, payload) => {
  const response = await api.post(`/super-admin/schools/${schoolId}/documents`, payload);
  return response.data;
};

// Delete school document
export const deleteSchoolDocument = async (documentId) => {
  const response = await api.delete(`/super-admin/school-documents/${documentId}`);
  return response.data;
};

// Fetch Plans Meta (billing cycles + feature checklist)
export const getPlansMeta = async () => {
  const response = await api.get("/super-admin/plans/meta");
  return response.data;
};

// Fetch Plan List (search + filters + pagination)
export const getPlans = async (params = {}) => {
  const response = await api.get("/super-admin/plans", { params });
  return response.data;
};

// Create a new Plan
export const createPlan = async (payload) => {
  const response = await api.post("/super-admin/plans", payload);
  return response.data;
};

// Get Plan Details
export const getPlanDetails = async (planId) => {
  const response = await api.get(`/super-admin/plans/${planId}`);
  return response.data;
};

// Update Plan Details
export const updatePlan = async (planId, payload) => {
  const response = await api.post(`/super-admin/plans/${planId}`, payload);
  return response.data;
};

// Toggle Plan Active / Inactive status
export const togglePlanStatus = async (planId) => {
  const response = await api.post(`/super-admin/plans/${planId}/toggle-status`);
  return response.data;
};

// Delete a Plan
export const deletePlan = async (planId) => {
  const response = await api.delete(`/super-admin/plans/${planId}`);
  return response.data;
};

// Fetch Platform Content Meta (content types, schools, classes)
export const getPlatformContentMeta = async () => {
  const response = await api.get("/super-admin/platform-content/meta");
  return response.data;
};

// Fetch distributed platform content items list
export const getPlatformContent = async (params = {}) => {
  const response = await api.get("/super-admin/platform-content", { params });
  return response.data;
};

// Upload & distribute platform content (Multipart Form data)
export const createPlatformContent = async (payload) => {
  const response = await api.post("/super-admin/platform-content", payload);
  return response.data;
};

// Get specific platform content details and distributions
export const getPlatformContentDetails = async (id) => {
  const response = await api.get(`/super-admin/platform-content/${id}`);
  return response.data;
};

// Toggle platform content Active / Inactive status
export const togglePlatformContentStatus = async (id) => {
  const response = await api.post(`/super-admin/platform-content/${id}/toggle-status`);
  return response.data;
};

// Delete platform content and distributions
export const deletePlatformContent = async (id) => {
  const response = await api.delete(`/super-admin/platform-content/${id}`);
  return response.data;
};

// Fetch Reports Meta options (Schools dropdown + period selections)
export const getReportsMeta = async () => {
  const response = await api.get("/super-admin/reports/meta");
  return response.data;
};

// Fetch Global KPIs overview + school-wise summary list
export const getGlobalReports = async (params = {}) => {
  const response = await api.get("/super-admin/reports", { params });
  return response.data;
};

// Fetch Paginated detailed list of students
export const getReportsStudents = async (params = {}) => {
  const response = await api.get("/super-admin/reports/students", { params });
  return response.data;
};

// Fetch Paginated detailed list of teachers
export const getReportsTeachers = async (params = {}) => {
  const response = await api.get("/super-admin/reports/teachers", { params });
  return response.data;
};

// Fetch Paginated detailed list of staff
export const getReportsStaff = async (params = {}) => {
  const response = await api.get("/super-admin/reports/staff", { params });
  return response.data;
};

// Export global reports in PDF / Excel / CSV formats
export const exportReports = async (format, params = {}) => {
  const response = await api.get(`/super-admin/reports/export/${format}`, {
    params,
    responseType: "blob"
  });
  return response; // returns axios response wrapper containing data blob
};

// Fetch Online Payments Meta (schools dropdown list + payment modes)
export const getOnlinePaymentsMeta = async () => {
  const response = await api.get("/super-admin/online-payments/meta");
  return response.data;
};

// Fetch Global Fee Collections/Transactions List (search + filters + pagination)
export const getOnlinePayments = async (params = {}) => {
  const response = await api.get("/super-admin/online-payments", { params });
  return response.data;
};

// Fetch Specific Transaction details by id
export const getTransactionDetails = async (id) => {
  const response = await api.get(`/super-admin/online-payments/${id}`);
  return response.data;
};

// Download/View Transaction PDF or print HTML receipt
export const downloadTransactionReceipt = async (id, format = "pdf") => {
  if (format === "print") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "/api";
    return `${baseUrl}/super-admin/online-payments/${id}/receipt?format=print`;
  }
  const response = await api.get(`/super-admin/online-payments/${id}/receipt?format=${format}`, {
    responseType: "blob"
  });
  return response;
};

// ==========================================
// INVENTORY MANAGEMENT SERVICES
// ==========================================

// Get dashboard summary, low stock products, pending school orders
export const getInventorySummary = async () => {
  const response = await api.get("/super-admin/inventory");
  return response.data;
};

// Get schools, categories, products and statuses for filters/forms dropdowns
export const getInventoryMeta = async () => {
  const response = await api.get("/super-admin/inventory/meta");
  return response.data;
};

// Categories CRUD
export const getInventoryCategories = async () => {
  const response = await api.get("/super-admin/inventory/categories");
  return response.data;
};
export const createInventoryCategory = async (data) => {
  const response = await api.post("/super-admin/inventory/categories", data);
  return response.data;
};
export const updateInventoryCategory = async (id, data) => {
  const response = await api.post(`/super-admin/inventory/categories/${id}`, data);
  return response.data;
};
export const deleteInventoryCategory = async (id) => {
  const response = await api.delete(`/super-admin/inventory/categories/${id}`);
  return response.data;
};

// Products CRUD
export const getInventoryProducts = async (params = {}) => {
  const response = await api.get("/super-admin/inventory/products", { params });
  return response.data;
};
export const createInventoryProduct = async (data) => {
  const response = await api.post("/super-admin/inventory/products", data);
  return response.data;
};
export const updateInventoryProduct = async (id, data) => {
  const response = await api.post(`/super-admin/inventory/products/${id}`, data);
  return response.data;
};
export const toggleInventoryProductStatus = async (id) => {
  const response = await api.post(`/super-admin/inventory/products/${id}/toggle-status`);
  return response.data;
};
export const clearInventoryProductStock = async (id) => {
  const response = await api.post(`/super-admin/inventory/products/${id}/clear-stock`);
  return response.data;
};
export const deleteInventoryProduct = async (id) => {
  const response = await api.delete(`/super-admin/inventory/products/${id}`);
  return response.data;
};

// Purchases
export const getInventoryPurchases = async (params = {}) => {
  const response = await api.get("/super-admin/inventory/purchases", { params });
  return response.data;
};
export const recordInventoryPurchase = async (data) => {
  const response = await api.post("/super-admin/inventory/purchases", data);
  return response.data;
};
export const downloadPurchaseReceipt = async (id) => {
  const response = await api.get(`/super-admin/inventory/purchases/${id}/receipt`, { responseType: "blob" });
  return response;
};

// Sales
export const getInventorySales = async (params = {}) => {
  const response = await api.get("/super-admin/inventory/sales", { params });
  return response.data;
};
export const recordInventorySale = async (data) => {
  const response = await api.post("/super-admin/inventory/sales", data);
  return response.data;
};
export const downloadSaleReceipt = async (id) => {
  const response = await api.get(`/super-admin/inventory/sales/${id}/receipt`, { responseType: "blob" });
  return response;
};

// School Purchase Orders
export const getInventoryOrders = async (params = {}) => {
  const response = await api.get("/super-admin/inventory/orders", { params });
  return response.data;
};
export const getInventoryOrderDetail = async (id) => {
  const response = await api.get(`/super-admin/inventory/orders/${id}`);
  return response.data;
};
export const confirmInventoryOrder = async (id) => {
  const response = await api.post(`/super-admin/inventory/orders/${id}/confirm`);
  return response.data;
};
export const cancelInventoryOrder = async (id) => {
  const response = await api.post(`/super-admin/inventory/orders/${id}/cancel`);
  return response.data;
};
export const downloadOrderReceipt = async (id) => {
  const response = await api.get(`/super-admin/inventory/orders/${id}/receipt`, { responseType: "blob" });
  return response;
};

// Reports & Global Export
export const getInventoryReports = async () => {
  const response = await api.get("/super-admin/inventory/reports");
  return response.data;
};
export const exportInventoryData = async (type, format) => {
  const response = await api.get(`/super-admin/inventory/export/${type}/${format}`, { responseType: "blob" });
  return response;
};

// ==========================================
// ROLES & PERMISSIONS SERVICES
// ==========================================

export const getRolesMeta = async () => {
  const response = await api.get("/super-admin/roles/meta");
  return response.data;
};

export const getRoles = async () => {
  const response = await api.get("/super-admin/roles");
  return response.data;
};

export const createRole = async (data) => {
  const response = await api.post("/super-admin/roles", data);
  return response.data;
};

export const getRoleDetail = async (id) => {
  const response = await api.get(`/super-admin/roles/${id}`);
  return response.data;
};

export const syncRolePermissions = async (id, data) => {
  const response = await api.post(`/super-admin/roles/${id}`, data);
  return response.data;
};

export const getSchoolAdminFeatures = async () => {
  const response = await api.get("/super-admin/roles/school-admin-features");
  return response.data;
};

export const updateSchoolAdminFeatures = async (data) => {
  const response = await api.post("/super-admin/roles/school-admin-features", data);
  return response.data;
};

// ==========================================
// SETTINGS & INTEGRATIONS SERVICES
// ==========================================

export const getSettingsMeta = async () => {
  const response = await api.get("/super-admin/settings/meta");
  return response.data;
};

export const getSystemSettings = async (params = {}) => {
  const response = await api.get("/super-admin/settings", { params });
  return response.data;
};

export const saveBulkSettings = async (data) => {
  const response = await api.post("/super-admin/settings", data);
  return response.data;
};

export const getIntegrationSettings = async () => {
  const response = await api.get("/super-admin/settings/integrations");
  return response.data;
};

export const saveIntegrationSettings = async (data) => {
  const response = await api.post("/super-admin/settings/integrations", data);
  return response.data;
};

// ==========================================
// LOGIN AUDIT LOGS SERVICES
// ==========================================

export const getLoginLogsMeta = async () => {
  const response = await api.get("/super-admin/login-logs/meta");
  return response.data;
};

export const getLoginLogs = async (params = {}) => {
  const response = await api.get("/super-admin/login-logs", { params });
  return response.data;
};

export const getLoginLogDetails = async (id) => {
  const response = await api.get(`/super-admin/login-logs/${id}`);
  return response.data;
};
