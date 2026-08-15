"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import {
  getInventorySummary,
  getInventoryMeta,
  getInventoryCategories,
  createInventoryCategory,
  updateInventoryCategory,
  deleteInventoryCategory,
  getInventoryProducts,
  createInventoryProduct,
  updateInventoryProduct,
  toggleInventoryProductStatus,
  clearInventoryProductStock,
  deleteInventoryProduct,
  getInventoryPurchases,
  recordInventoryPurchase,
  downloadPurchaseReceipt,
  getInventorySales,
  recordInventorySale,
  downloadSaleReceipt,
  getInventoryOrders,
  getInventoryOrderDetail,
  confirmInventoryOrder,
  cancelInventoryOrder,
  downloadOrderReceipt,
  exportInventoryData
} from "@/features/super-admin/services/super-admin.service";
import {
  FaBoxes,
  FaShoppingCart,
  FaTruckLoading,
  FaTags,
  FaClipboardList,
  FaFileExport,
  FaPlus,
  FaCheck,
  FaTimes,
  FaCoins,
  FaEye,
  FaDownload,
  FaTrash,
  FaSync,
  FaFileInvoiceDollar,
  FaBuilding,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaToggleOn,
  FaToggleOff,
  FaEdit
} from "react-icons/fa";
import { useAppDialog } from "@/context/DialogContext";

export default function SuperAdminInventoryPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    schools: [],
    categories: [],
    active_categories: [],
    active_products: [],
    order_statuses: [],
    export_types: [],
    export_formats: []
  });

  // State Objects
  const [summary, setSummary] = useState({
    products: 0,
    active_products: 0,
    stock_units: 0,
    low_stock: 0,
    purchase_total: 0,
    purchase_gst: 0,
    sales_total: 0,
    sales_gst: 0,
    pending_orders: 0
  });
  const [lowStockList, setLowStockList] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  // Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", sort_order: 1, is_active: true });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    sku: "",
    platform_product_category_id: "",
    sell_price: "",
    gst_percent: 0,
    hsn_code: ""
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    platform_product_id: "",
    quantity: "",
    unit_cost: "",
    gst_percent: 0,
    vendor_name: "",
    purchased_at: new Date().toISOString().split("T")[0]
  });
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({
    platform_product_id: "",
    quantity: "",
    unit_price: "",
    gst_percent: 0,
    school_id: "",
    sold_at: new Date().toISOString().split("T")[0]
  });
  const [submittingSale, setSubmittingSale] = useState(false);

  // Listing Data States
  const [categoriesList, setCategoriesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Order Details Modal Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  // Load Meta and Dashboard Summary initially
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const summaryRes = await getInventorySummary();
      const metaRes = await getInventoryMeta();
      if (summaryRes.success) {
        setSummary(summaryRes.summary);
        setLowStockList(summaryRes.low_stock || []);
        setPendingOrders(summaryRes.pending_orders || []);
      }
      if (metaRes.success) {
        setMeta(metaRes);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Failed to load inventory summary statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch Listing Tab Data on Navigation or Filter changes
  const fetchTabData = async () => {
    try {
      if (activeTab === "categories") {
        const res = await getInventoryCategories();
        if (res.success) {
          setCategoriesList(res.categories || res.data || []);
        }
      } else if (activeTab === "products") {
        const params = {
          page: currentPage,
          per_page: pageSize,
          search: searchQuery || undefined,
          category_id: filterCategory || undefined
        };
        const res = await getInventoryProducts(params);
        if (res.success) {
          setProductsList(res.products?.data || res.products || []);
          setTotalRecords(res.products?.total || (res.products || []).length);
        }
      } else if (activeTab === "purchases") {
        const params = {
          page: currentPage,
          per_page: pageSize,
          search: searchQuery || undefined
        };
        const res = await getInventoryPurchases(params);
        if (res.success) {
          setPurchasesList(res.purchases?.data || res.purchases || []);
          setTotalRecords(res.purchases?.total || (res.purchases || []).length);
        }
      } else if (activeTab === "sales") {
        const params = {
          page: currentPage,
          per_page: pageSize,
          search: searchQuery || undefined,
          school_id: filterSchool || undefined
        };
        const res = await getInventorySales(params);
        if (res.success) {
          setSalesList(res.sales?.data || res.sales || []);
          setTotalRecords(res.sales?.total || (res.sales || []).length);
        }
      } else if (activeTab === "orders") {
        const params = {
          page: currentPage,
          per_page: pageSize,
          status: filterStatus || undefined,
          school_id: filterSchool || undefined,
          search: searchQuery || undefined,
          date_from: filterDateFrom || undefined,
          date_to: filterDateTo || undefined
        };
        const res = await getInventoryOrders(params);
        if (res.success) {
          setOrdersList(res.orders || []);
          setTotalRecords(res.count || (res.orders || []).length);
        }
      }
    } catch (err) {
      console.error(`Error loading tab ${activeTab}:`, err);
    }
  };

  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "reports") {
      fetchTabData();
    }
  }, [activeTab, currentPage, filterCategory, filterSchool, filterStatus, filterDateFrom, filterDateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTabData();
  };

  // CATEGORIES Action Handlers
  const handleOpenCategoryCreate = () => {
    setCategoryForm({ id: "", name: "", sort_order: 1, is_active: true });
    setShowCategoryModal(true);
  };

  const handleOpenCategoryEdit = (cat) => {
    setCategoryForm({
      id: cat.id,
      name: cat.name,
      sort_order: cat.sort_order || 1,
      is_active: cat.is_active ?? true
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      let res;
      if (categoryForm.id) {
        res = await updateInventoryCategory(categoryForm.id, categoryForm);
      } else {
        res = await createInventoryCategory(categoryForm);
      }
      if (res.success) {
        toast.success(res.message || "Category saved successfully.");
        setShowCategoryModal(false);
        fetchTabData();
        getInventoryMeta().then((metaRes) => metaRes.success && setMeta(metaRes));
      } else {
        toast.error(res.message || "Failed to save category.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving Category.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Category",
      message: "Are you sure you want to delete this Category?",
      confirmText: "Delete",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      const res = await deleteInventoryCategory(id);
      if (res.success) {
        toast.success("Category deleted.");
        fetchTabData();
      } else {
        toast.error(res.message || "Failed to delete category.");
      }
    } catch (err) {
      toast.error("Error deleting category.");
    }
  };

  // PRODUCTS Action Handlers
  const handleOpenProductCreate = () => {
    setProductForm({
      id: "",
      name: "",
      sku: "",
      platform_product_category_id: meta.active_categories?.[0]?.id || "",
      sell_price: "",
      gst_percent: 0,
      hsn_code: ""
    });
    setShowProductModal(true);
  };

  const handleOpenProductEdit = (prod) => {
    setProductForm({
      id: prod.id,
      name: prod.name,
      sku: prod.sku || "",
      platform_product_category_id: prod.platform_product_category_id || "",
      sell_price: prod.sell_price || "",
      gst_percent: prod.gst_percent || 0,
      hsn_code: prod.hsn_code || ""
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      let res;
      if (productForm.id) {
        res = await updateInventoryProduct(productForm.id, productForm);
      } else {
        res = await createInventoryProduct(productForm);
      }
      if (res.success) {
        toast.success(res.message || "Product catalogs updated.");
        setShowProductModal(false);
        fetchTabData();
      } else {
        toast.error(res.message || "Failed to save product.");
      }
    } catch (err) {
      toast.error("Error saving product catalog.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleToggleProductStatus = async (id) => {
    try {
      const res = await toggleInventoryProductStatus(id);
      if (res.success) {
        toast.success("Product active status toggled.");
        fetchTabData();
      } else {
        toast.error(res.message || "Failed to toggle status.");
      }
    } catch (err) {
      toast.error("Error toggling product status.");
    }
  };

  const handleClearProductStock = async (id) => {
    const isConfirmed = await dialog.confirm({
      title: "Clear Stock",
      message: "Are you sure you want to clear/zero this product's stock?",
      confirmText: "Clear Stock",
      type: "warning"
    });
    if (!isConfirmed) return;
    try {
      const res = await clearInventoryProductStock(id);
      if (res.success) {
        toast.success("Product stock zeroed successfully.");
        fetchTabData();
        loadDashboardData();
      } else {
        toast.error(res.message || "Failed to clear stock.");
      }
    } catch (err) {
      toast.error("Error clearing stock.");
    }
  };

  const handleDeleteProduct = async (id) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Product Catalog",
      message: "Delete this product catalogue entry permanently?",
      confirmText: "Delete",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      const res = await deleteInventoryProduct(id);
      if (res.success) {
        toast.success("Product deleted.");
        fetchTabData();
        loadDashboardData();
      } else {
        toast.error(res.message || "Failed to delete product.");
      }
    } catch (err) {
      toast.error("Error deleting product.");
    }
  };

  // PURCHASES Action Handlers
  const handleOpenPurchaseRecord = () => {
    setPurchaseForm({
      platform_product_id: meta.active_products?.[0]?.id || "",
      quantity: "",
      unit_cost: "",
      gst_percent: 0,
      vendor_name: "",
      purchased_at: new Date().toISOString().split("T")[0]
    });
    setShowPurchaseModal(true);
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    setSubmittingPurchase(true);
    try {
      const res = await recordInventoryPurchase(purchaseForm);
      if (res.success) {
        toast.success(res.message || "Purchase entry added.");
        setShowPurchaseModal(false);
        fetchTabData();
        loadDashboardData();
      } else {
        toast.error(res.message || "Failed to record purchase.");
      }
    } catch (err) {
      toast.error("Error recording purchase.");
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const handleDownloadPurchaseReceipt = async (id, title = "purchase") => {
    try {
      toast.loading(`Downloading ${title} receipt...`);
      const res = title === "purchase" ? await downloadPurchaseReceipt(id) : await downloadSaleReceipt(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${title === "purchase" ? "Purchase" : "Sale"}-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.dismiss();
      toast.success("Receipt downloaded.");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to download PDF receipt.");
    }
  };

  // SALES Action Handlers
  const handleOpenSaleRecord = () => {
    setSaleForm({
      platform_product_id: meta.active_products?.[0]?.id || "",
      quantity: "",
      unit_price: "",
      gst_percent: 0,
      school_id: meta.schools?.[0]?.id || "",
      sold_at: new Date().toISOString().split("T")[0]
    });
    setShowSaleModal(true);
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    setSubmittingSale(true);
    try {
      const res = await recordInventorySale(saleForm);
      if (res.success) {
        toast.success(res.message || "Sale registered successfully.");
        setShowSaleModal(false);
        fetchTabData();
        loadDashboardData();
      } else {
        toast.error(res.message || "Failed to record sale.");
      }
    } catch (err) {
      toast.error("Error submitting direct sale.");
    } finally {
      setSubmittingSale(false);
    }
  };

  // ORDERS Action Handlers
  const handleViewOrderDetail = async (id) => {
    setOrderDetailLoading(true);
    setShowOrderDetailModal(true);
    try {
      const res = await getInventoryOrderDetail(id);
      if (res.success) {
        setSelectedOrder(res.order || res.data);
      } else {
        toast.error("Failed to load order details.");
        setShowOrderDetailModal(false);
      }
    } catch (err) {
      toast.error("Error retrieving order details.");
      setShowOrderDetailModal(false);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleConfirmOrder = async (id) => {
    const isConfirmed = await dialog.confirm({
      title: "Confirm Purchase Order",
      message: "Confirm and process this school purchase order?",
      confirmText: "Confirm",
      type: "confirm"
    });
    if (!isConfirmed) return;
    try {
      const res = await confirmInventoryOrder(id);
      if (res.success) {
        toast.success("Purchase order confirmed!");
        fetchTabData();
        loadDashboardData();
        if (showOrderDetailModal) setShowOrderDetailModal(false);
      } else {
        toast.error(res.message || "Failed to confirm order.");
      }
    } catch (err) {
      toast.error("Error processing order.");
    }
  };

  const handleCancelOrder = async (id) => {
    const isConfirmed = await dialog.confirm({
      title: "Cancel Order",
      message: "Are you sure you want to cancel this pending order?",
      confirmText: "Cancel Order",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      const res = await cancelInventoryOrder(id);
      if (res.success) {
        toast.success("Purchase order cancelled.");
        fetchTabData();
        loadDashboardData();
        if (showOrderDetailModal) setShowOrderDetailModal(false);
      } else {
        toast.error(res.message || "Failed to cancel order.");
      }
    } catch (err) {
      toast.error("Error cancelling order.");
    }
  };

  const handleDownloadOrderReceipt = async (id) => {
    try {
      toast.loading("Generating Order PDF receipt...");
      const res = await downloadOrderReceipt(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Purchase-Order-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.dismiss();
      toast.success("Order PDF downloaded.");
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to download PDF invoice receipt.");
    }
  };

  // EXPORTS
  const handleExportData = async (type, format) => {
    try {
      toast.loading(`Preparing ${type} export in ${format}...`);
      const res = await exportInventoryData(type, format);
      const blob = new Blob([res.data], {
        type:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf"
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Global-Inventory-${type}-${new Date().toISOString().split("T")[0]}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.dismiss();
      toast.success("Export successful.");
    } catch (err) {
      toast.dismiss();
      toast.error("Export generation failed.");
    }
  };

  const renderTabTrigger = (tabName, label, icon) => {
    const Icon = icon;
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => {
          setActiveTab(tabName);
          setCurrentPage(1);
          setSearchQuery("");
          setFilterCategory("");
          setFilterSchool("");
          setFilterStatus("");
        }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
          isActive
            ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </button>
    );
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-left w-full">
        <PageHeader
          title="Warehouse & Inventory Hub"
          description="Global stock management, purchases, direct invoicing, and school purchase orders."
        />

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-sm overflow-x-auto">
          {renderTabTrigger("overview", "Overview", FaClipboardList)}
          {renderTabTrigger("categories", "Categories", FaTags)}
          {renderTabTrigger("products", "Products Catalog", FaBoxes)}
          {renderTabTrigger("purchases", "Warehouse Purchases", FaTruckLoading)}
          {renderTabTrigger("sales", "Direct Sales", FaCoins)}
          {renderTabTrigger("orders", "School Orders", FaShoppingCart)}
          {renderTabTrigger("reports", "Export Hub", FaFileExport)}
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <PageLoader />
          </div>
        ) : (
          <>
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Stock in Warehouse */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Stock In Warehouse
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                        <FaBoxes />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                          {summary.stock_units || 0}
                        </h3>
                        <span className="text-xs font-medium text-slate-500">Units</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{summary.products} distinct products</p>
                    </div>
                  </div>

                  {/* Low Stock count */}
                  <div
                    className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                      summary.low_stock > 0
                        ? "bg-amber-50/30 border-amber-200"
                        : "bg-white border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Low Stock Alert
                      </span>
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ring-1 ${
                          summary.low_stock > 0
                            ? "bg-amber-100 text-amber-700 ring-amber-500/20"
                            : "bg-slate-100 text-slate-400 ring-slate-500/10"
                        }`}
                      >
                        <FaClipboardList />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3
                        className={`text-2xl font-bold tracking-tight ${
                          summary.low_stock > 0 ? "text-amber-600" : "text-slate-900"
                        }`}
                      >
                        {summary.low_stock || 0} Items
                      </h3>
                      <p className="text-xs text-amber-700 font-medium mt-1">Needs immediate reorder</p>
                    </div>
                  </div>

                  {/* Purchase Expense */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total Procurement
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm ring-1 ring-rose-500/10">
                        <FaFileInvoiceDollar />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        ₹{(summary.purchase_total || 0).toLocaleString()}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Inc. GST: ₹{summary.purchase_gst || 0}</p>
                    </div>
                  </div>

                  {/* Sales total */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total Sales Income
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm ring-1 ring-emerald-500/10">
                        <FaCoins />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        ₹{(summary.sales_total || 0).toLocaleString()}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Pending school POs: {summary.pending_orders}</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Tables (Pending Orders & Low Stock) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Pending Orders (Col 7) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Pending School Orders</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Awaiting confirmation and shipping</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 text-xs font-semibold">
                        {pendingOrders.length} Pending
                      </span>
                    </div>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-3.5 pl-6 pr-3 whitespace-nowrap min-w-[140px]">Order No</th>
                            <th className="py-3.5 px-3 whitespace-nowrap min-w-[180px]">School Name</th>
                            <th className="py-3.5 px-3 whitespace-nowrap min-w-[120px]">Total Amount</th>
                            <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                          {pendingOrders.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-10 text-center text-slate-400 italic text-sm">
                                No pending orders.
                              </td>
                            </tr>
                          ) : (
                            pendingOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 pl-6 pr-3 whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                                  {ord.order_no}
                                </td>
                                <td className="py-3.5 px-3 whitespace-nowrap text-slate-700">
                                  {ord.school_name}
                                </td>
                                <td className="py-3.5 px-3 whitespace-nowrap text-emerald-600 font-bold">
                                  ₹{Number(ord.total_amount || 0).toLocaleString()}
                                </td>
                                <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleViewOrderDetail(ord.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 transition-colors"
                                      title="Review order"
                                    >
                                      <FaEye className="w-3 h-3 text-slate-400" />
                                      <span>Review</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmOrder(ord.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                      title="Confirm order"
                                    >
                                      <FaCheck className="w-3 h-3 text-emerald-600" />
                                      <span>Confirm</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Low Stock Alerts (Col 5) */}
                  <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Low Stock Alerts</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Items below reorder limit</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 text-xs font-semibold">
                        {lowStockList.length} Items
                      </span>
                    </div>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse min-w-[350px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-3.5 pl-6 pr-3 whitespace-nowrap min-w-[150px]">Product</th>
                            <th className="py-3.5 px-3 whitespace-nowrap min-w-[100px]">SKU</th>
                            <th className="py-3.5 pl-3 pr-6 text-center whitespace-nowrap min-w-[100px]">In Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                          {lowStockList.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="py-10 text-center text-slate-400 italic text-sm">
                                All items are sufficiently stocked.
                              </td>
                            </tr>
                          ) : (
                            lowStockList.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 pl-6 pr-3 whitespace-nowrap font-semibold text-slate-900">
                                  {item.name}
                                </td>
                                <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-slate-500">
                                  {item.sku}
                                </td>
                                <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 text-xs font-bold">
                                    {item.stock_qty} Qty
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CATEGORIES */}
            {activeTab === "categories" && (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Product Categories</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Organize inventory cataloging segments</p>
                  </div>
                  <Button
                    onClick={handleOpenCategoryCreate}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 shadow-sm"
                  >
                    <FaPlus className="w-3 h-3" /> Add Category
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[200px]">Category Name</th>
                        <th className="py-4 px-4 whitespace-nowrap min-w-[160px]">Slug Key</th>
                        <th className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">Sort Index</th>
                        <th className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">Status</th>
                        <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {categoriesList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-400 italic text-sm">
                            No categories loaded.
                          </td>
                        </tr>
                      ) : (
                        categoriesList.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 pl-6 pr-4 whitespace-nowrap font-semibold text-slate-900">
                              {cat.name}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-xs font-mono text-slate-500">
                              {cat.slug || "—"}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-center text-slate-600">
                              {cat.sort_order ?? 0}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  cat.is_active
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                    : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                                }`}
                              >
                                {cat.is_active ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCategoryEdit(cat)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 transition-colors"
                                  title="Edit category"
                                >
                                  <FaEdit className="w-3 h-3 text-slate-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-colors"
                                  title="Delete category"
                                >
                                  <FaTrash className="w-3 h-3 text-red-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: PRODUCTS CATALOG */}
            {activeTab === "products" && (
              <div className="space-y-4">
                {/* Search & Filter Header */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
                    <div className="flex-1 min-w-[220px] relative">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search products by SKU or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div className="min-w-[170px]">
                      <select
                        value={filterCategory}
                        onChange={(e) => {
                          setFilterCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="">All Categories</option>
                        {meta.categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button type="submit" variant="secondary" size="sm" className="py-2.5 px-4 text-xs font-semibold">
                      Filter
                    </Button>
                  </form>

                  <Button
                    onClick={handleOpenProductCreate}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 shadow-sm"
                  >
                    <FaPlus className="w-3 h-3" /> Add Product
                  </Button>
                </div>

                {/* Table list */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[140px]">Product SKU</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Product Name</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[150px]">Category</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[130px]">Available Stock</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[160px]">Sell Price</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">Status</th>
                          <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[200px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {productsList.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400 italic text-sm">
                              No products recorded.
                            </td>
                          </tr>
                        ) : (
                          productsList.map((prod) => (
                            <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 pl-6 pr-4 whitespace-nowrap font-mono text-xs text-slate-500">
                                {prod.sku || "—"}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-900">
                                {prod.name}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                                {prod.category || "—"}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    prod.stock_qty <= 5
                                      ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                                      : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                  }`}
                                >
                                  {prod.stock_qty} Qty
                                </span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900">
                                    ₹{Number(prod.sell_price || 0).toLocaleString()}
                                  </span>
                                  {prod.gst_percent > 0 && (
                                    <span className="text-[11px] text-slate-400 font-normal mt-0.5">
                                      Inc. {prod.gst_percent}% GST (₹{Number(prod.price_with_gst || prod.sell_price).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStatus(prod.id)}
                                  className={`inline-flex items-center transition-all cursor-pointer ${
                                    prod.is_active ? "text-violet-600" : "text-slate-300"
                                  }`}
                                  title="Toggle Active Status"
                                >
                                  {prod.is_active ? (
                                    <FaToggleOn className="w-7 h-7" />
                                  ) : (
                                    <FaToggleOff className="w-7 h-7" />
                                  )}
                                </button>
                              </td>
                              <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProductEdit(prod)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 transition-colors"
                                    title="Edit product"
                                  >
                                    <FaEdit className="w-3 h-3 text-slate-400" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleClearProductStock(prod.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                    title="Zero stock units"
                                  >
                                    <FaSync className="w-3 h-3 text-amber-600" />
                                    <span>Zero</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-colors"
                                    title="Delete product"
                                  >
                                    <FaTrash className="w-3 h-3 text-red-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalRecords > pageSize && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-white">
                      <Pagination
                        currentPage={currentPage}
                        totalCount={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: WAREHOUSE PURCHASES */}
            {activeTab === "purchases" && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search purchases by vendor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    />
                  </form>

                  <Button
                    onClick={handleOpenPurchaseRecord}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 shadow-sm"
                  >
                    <FaPlus className="w-3 h-3" /> Record Purchase
                  </Button>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[180px]">Receipt / Date</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Product Name</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Vendor / Supplier</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">Unit Cost</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">Quantity</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Total Cost</th>
                          <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[120px]">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {purchasesList.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400 italic text-sm">
                              No purchase entries recorded.
                            </td>
                          </tr>
                        ) : (
                          purchasesList.map((pur) => (
                            <tr key={pur.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900 text-sm">
                                    {pur.receipt_no || `PUR-${pur.id.slice(0, 6)}`}
                                  </span>
                                  <span className="text-xs font-mono text-slate-400 mt-0.5">
                                    {pur.purchased_at || "—"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-900">
                                {pur.product_name || pur.platform_product?.name || "—"}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                                {pur.vendor_name || "—"}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700">
                                ₹{Number(pur.unit_cost || 0).toLocaleString()}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700 font-semibold">
                                {pur.quantity} units
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-emerald-600 font-bold">
                                ₹{Number(pur.total_amount || pur.unit_cost * pur.quantity).toLocaleString()}
                              </td>
                              <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPurchaseReceipt(pur.id, "purchase")}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-colors"
                                  title="Download receipt PDF"
                                >
                                  <FaDownload className="w-3 h-3 text-blue-600" />
                                  <span>PDF</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalRecords > pageSize && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-white">
                      <Pagination
                        currentPage={currentPage}
                        totalCount={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DIRECT SALES */}
            {activeTab === "sales" && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
                    <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search sales logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </form>

                    <div className="min-w-[170px]">
                      <select
                        value={filterSchool}
                        onChange={(e) => {
                          setFilterSchool(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="">All Schools</option>
                        {meta.schools?.map((sch) => (
                          <option key={sch.id} value={sch.id}>
                            {sch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleOpenSaleRecord}
                    variant="primary"
                    size="sm"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 shadow-sm"
                  >
                    <FaPlus className="w-3 h-3" /> Direct Sale to School
                  </Button>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[180px]">Receipt / Date</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[200px]">Product Name</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">School Name</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">Unit Price</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[110px]">Quantity</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Total Amount</th>
                          <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[120px]">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {salesList.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400 italic text-sm">
                              No sales transactions logged.
                            </td>
                          </tr>
                        ) : (
                          salesList.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-900 text-sm">
                                    {sale.receipt_no || `SAL-${sale.id.slice(0, 6)}`}
                                  </span>
                                  <span className="text-xs font-mono text-slate-400 mt-0.5">
                                    {sale.sold_at || "—"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-900">
                                {sale.product_name || "—"}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                                {sale.school_name || "—"}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700">
                                ₹{Number(sale.unit_price || 0).toLocaleString()}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center text-slate-700 font-semibold">
                                {sale.quantity} units
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-emerald-600 font-bold">
                                ₹{Number(sale.total_amount || sale.unit_price * sale.quantity).toLocaleString()}
                              </td>
                              <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPurchaseReceipt(sale.id, "sale")}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-colors"
                                  title="Download invoice PDF"
                                >
                                  <FaDownload className="w-3 h-3 text-blue-600" />
                                  <span>PDF</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalRecords > pageSize && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-white">
                      <Pagination
                        currentPage={currentPage}
                        totalCount={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SCHOOL ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                    <div className="relative">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search PO Number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <select
                        value={filterSchool}
                        onChange={(e) => {
                          setFilterSchool(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="">All Schools</option>
                        {meta.schools?.map((sch) => (
                          <option key={sch.id} value={sch.id}>
                            {sch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      >
                        <option value="">All Statuses</option>
                        {meta.order_statuses?.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterSchool("");
                          setFilterStatus("");
                          setFilterDateFrom("");
                          setFilterDateTo("");
                          setCurrentPage(1);
                        }}
                        className="w-1/2 py-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                      >
                        Reset
                      </Button>
                      <Button type="submit" variant="primary" size="sm" className="w-1/2 py-2 text-xs font-semibold shadow-sm">
                        Search
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Listing */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[160px]">PO Number</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">School Name</th>
                          <th className="py-4 px-4 text-center whitespace-nowrap min-w-[120px]">Status</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Total Amount</th>
                          <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Created At</th>
                          <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[220px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {ordersList.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400 italic text-sm">
                              No purchase orders found matching parameters.
                            </td>
                          </tr>
                        ) : (
                          ordersList.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 pl-6 pr-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                                {ord.order_no}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-slate-700">
                                {ord.school_name}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                    ord.status === "pending"
                                      ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                                      : ord.status === "confirmed"
                                      ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                      : ord.status === "received"
                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                      : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap text-emerald-600 font-bold">
                                ₹{Number(ord.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                                {ord.created_at ? new Date(ord.created_at).toLocaleString() : "—"}
                              </td>
                              <td className="py-4 pl-4 pr-6 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleViewOrderDetail(ord.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 transition-colors"
                                    title="View items list"
                                  >
                                    <FaEye className="w-3 h-3 text-slate-400" />
                                    <span>View</span>
                                  </button>

                                  {ord.status === "pending" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmOrder(ord.id)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                        title="Confirm order"
                                      >
                                        <FaCheck className="w-3 h-3 text-emerald-600" />
                                        <span>Confirm</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCancelOrder(ord.id)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition-colors"
                                        title="Cancel order"
                                      >
                                        <FaTimes className="w-3 h-3 text-red-500" />
                                        <span>Cancel</span>
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadOrderReceipt(ord.id)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 transition-colors"
                                    title="Download receipt Invoice"
                                  >
                                    <FaDownload className="w-3 h-3 text-blue-600" />
                                    <span>Invoice</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalRecords > pageSize && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-white">
                      <Pagination
                        currentPage={currentPage}
                        totalCount={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: REPORTS & GLOBAL EXPORT */}
            {activeTab === "reports" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {meta.export_types?.map((exp) => (
                  <div
                    key={exp.value}
                    className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{exp.label} Exports</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Download raw {exp.label.toLowerCase()} transactional records and ledger arrays directly in
                        spreadsheet or publication PDF layout.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleExportData(exp.value, "excel")}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <FaFileExport className="w-3.5 h-3.5" />
                        Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportData(exp.value, "pdf")}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <FaDownload className="w-3.5 h-3.5" />
                        PDF (.pdf)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: ADD / EDIT CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">
                {categoryForm.id ? "Edit Category Details" : "Create Product Category"}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Stationery, Books..."
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Active Status</label>
                  <select
                    value={categoryForm.is_active ? "true" : "false"}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.value === "true" })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoryModal(false)}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingCategory}
                  className="text-xs font-semibold px-4 py-2 shadow-sm"
                >
                  {submittingCategory ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">
                {productForm.id ? "Edit Product Catalogue" : "Add Product to Catalogue"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Notebook A4"
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="e.g. NB-A4"
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Category *</label>
                  <select
                    required
                    value={productForm.platform_product_category_id}
                    onChange={(e) => setProductForm({ ...productForm, platform_product_category_id: e.target.value })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {meta.categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Sell Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.sell_price}
                    onChange={(e) => setProductForm({ ...productForm, sell_price: e.target.value })}
                    className="w-full border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">GST (%)</label>
                  <input
                    type="number"
                    value={productForm.gst_percent}
                    onChange={(e) => setProductForm({ ...productForm, gst_percent: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">HSN Code</label>
                  <input
                    type="text"
                    value={productForm.hsn_code}
                    onChange={(e) => setProductForm({ ...productForm, hsn_code: e.target.value })}
                    placeholder="4820"
                    className="w-full border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductModal(false)}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingProduct}
                  className="text-xs font-semibold px-4 py-2 shadow-sm"
                >
                  {submittingProduct ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD WAREHOUSE PURCHASE */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">Record Inventory Purchase</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Product *</label>
                <select
                  required
                  value={purchaseForm.platform_product_id}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, platform_product_id: e.target.value })}
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                >
                  {meta.active_products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) || "" })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Unit Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchaseForm.unit_cost}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unit_cost: e.target.value })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">GST Percent (%)</label>
                  <input
                    type="number"
                    value={purchaseForm.gst_percent}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, gst_percent: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchased_at}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchased_at: e.target.value })}
                    className="w-full border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={purchaseForm.vendor_name}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor_name: e.target.value })}
                  placeholder="e.g. ABC Trading Co."
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingPurchase}
                  className="text-xs font-semibold px-4 py-2 shadow-sm"
                >
                  {submittingPurchase ? "Recording..." : "Record Purchase"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT SALE TO SCHOOL */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">Direct Sale to School</h3>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Recipient School *</label>
                <select
                  required
                  value={saleForm.school_id}
                  onChange={(e) => setSaleForm({ ...saleForm, school_id: e.target.value })}
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                >
                  {meta.schools?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Product *</label>
                <select
                  required
                  value={saleForm.platform_product_id}
                  onChange={(e) => setSaleForm({ ...saleForm, platform_product_id: e.target.value })}
                  className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                >
                  {meta.active_products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (In stock: {p.stock_qty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) || "" })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Unit Sell Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={saleForm.unit_price}
                    onChange={(e) => setSaleForm({ ...saleForm, unit_price: e.target.value })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">GST Percent (%)</label>
                  <input
                    type="number"
                    value={saleForm.gst_percent}
                    onChange={(e) => setSaleForm({ ...saleForm, gst_percent: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={saleForm.sold_at}
                    onChange={(e) => setSaleForm({ ...saleForm, sold_at: e.target.value })}
                    className="w-full border border-slate-200 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaleModal(false)}
                  className="text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingSale}
                  className="text-xs font-semibold px-4 py-2 shadow-sm"
                >
                  {submittingSale ? "Recording..." : "Record Sale"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER: SCHOOL INCOMING ORDER DETAILS */}
      {showOrderDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm border border-violet-100">
                  <FaShoppingCart />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Purchase Order Details</h3>
                  <p className="text-[11px] text-slate-500">School order log info</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetailModal(false);
                  setSelectedOrder(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {orderDetailLoading ? (
                <div className="py-16 flex justify-center items-center">
                  <PageLoader />
                </div>
              ) : selectedOrder ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      selectedOrder.status === "pending"
                        ? "bg-amber-50/60 border-amber-200 text-amber-800"
                        : selectedOrder.status === "received"
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                        : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs capitalize">Order {selectedOrder.status || "Unknown"}</p>
                      <p className="text-[11px] opacity-75 mt-0.5">Order No: {selectedOrder.order_no || "—"}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Created: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  {/* Institution Details */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Ordering Institution
                      </span>
                      <span className="text-slate-900 font-bold text-xs block mt-0.5">
                        {selectedOrder.school_name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Notes
                      </span>
                      <span className="text-slate-700 text-xs block mt-0.5 font-normal">
                        {selectedOrder.notes || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Order Line Items
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 pl-3 pr-2">Item Product</th>
                            <th className="py-2.5 px-2 text-center">Qty</th>
                            <th className="py-2.5 px-2">Price</th>
                            <th className="py-2.5 pl-2 pr-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                          {selectedOrder.items?.map((it) => (
                            <tr key={it.id}>
                              <td className="py-2.5 pl-3 pr-2 font-semibold text-slate-900">{it.product_name}</td>
                              <td className="py-2.5 px-2 text-center">{it.quantity}</td>
                              <td className="py-2.5 px-2 text-slate-500">₹{it.unit_price}</td>
                              <td className="py-2.5 pl-2 pr-3 text-right font-bold text-slate-900">
                                ₹{Number(it.total_amount || it.subtotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Cost Footer */}
                  <div className="flex justify-between items-center bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                        Total PO Value
                      </span>
                      <span className="text-xs text-emerald-600">
                        Includes GST Amount: ₹{selectedOrder.gst_amount || 0}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700">
                      ₹{Number(selectedOrder.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 italic">Failed to load order detailed view.</div>
              )}
            </div>

            {/* Fixed Footer Actions */}
            {selectedOrder && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50/50">
                {selectedOrder.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="font-semibold text-xs py-2 px-4 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel Order
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConfirmOrder(selectedOrder.id)}
                      className="font-semibold text-xs py-2 px-4 shadow-sm bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                    >
                      Confirm Order
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadOrderReceipt(selectedOrder.id)}
                  className="inline-flex items-center gap-1.5 font-semibold text-xs py-2 px-4"
                >
                  <FaDownload /> Invoice PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}