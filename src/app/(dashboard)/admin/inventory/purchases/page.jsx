"use client";

import { useEffect, useState, Fragment } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaSearch, FaFileInvoiceDollar, FaCalendarAlt, FaHistory, FaCheckCircle, FaHourglassHalf,
  FaTimesCircle, FaDownload, FaChevronLeft, FaExpand, FaBoxes
} from "react-icons/fa";
import {
  getInventoryMeta,
  getPurchaseOrders,
  receivePurchaseOrder
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import Link from "next/link";
import { api } from "@/services/api";

export default function AdminPurchaseOrdersPage() {
  const dialog = useAppDialog();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState(null);

  // Roster options
  const [statuses, setStatuses] = useState([]);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Expandable Order details row
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Fetch Meta
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await getInventoryMeta();
        setStatuses(data.order_statuses || []);
      } catch (err) {
        console.warn("Failed to load inventory meta options:", err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Purchase Orders
  const loadOrders = async () => {
    try {
      setListLoading(true);
      const params = { per_page: pageSize, page: currentPage };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const data = await getPurchaseOrders(params);
      setOrders(data.orders || data.data || []);
      setTotals(data.totals || null);
    } catch (err) {
      toast.error("Failed to load purchase orders: " + (err.message || err));
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, dateFrom, dateTo, currentPage, pageSize]);

  // Debounced Search Trigger
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        loadOrders();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Export Purchase Orders (Step 3: Placeholder/Prepped formats)
  const handleExport = async (format) => {
    try {
      toast.loading(`Exporting purchase orders as ${format.toUpperCase()}...`, { id: "export-purchases" });
      const queryParams = {};
      if (statusFilter) queryParams.status = statusFilter;
      if (searchQuery.trim()) queryParams.search = searchQuery.trim();
      if (dateFrom) queryParams.date_from = dateFrom;
      if (dateTo) queryParams.date_to = dateTo;

      const response = await api.get(`/admin/inventory/purchases/export/${format}`, {
        params: queryParams,
        responseType: "blob"
      });

      const blob = response.data;
      if (blob.type === "application/json") {
        const text = await blob.text();
        const errObj = text ? JSON.parse(text) : {};
        throw new Error(errObj.message || "Failed to export purchase orders.");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `purchase_orders_export.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported purchase orders as ${format.toUpperCase()} successfully!`, { id: "export-purchases" });
    } catch (err) {
      toast.error("Failed to trigger report export: " + (err.message || err), { id: "export-purchases" });
    }
  };

  // Receive Purchase Order handler
  const handleReceiveOrder = async (orderId, orderNo) => {
    const isConfirmed = await dialog.confirm({
      title: "Receive Purchase Order Items",
      message: `Are you sure you want to receive items from purchase order "${orderNo}" into stock inventory?`,
      type: "confirm",
      confirmText: "Receive Items",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      setListLoading(true);
      await receivePurchaseOrder(orderId);
      toast.success(`Purchase order ${orderNo} items received into stock successfully.`);
      loadOrders();
    } catch (err) {
      toast.error("Failed to receive order items: " + (err.message || err));
    } finally {
      setListLoading(false);
    }
  };

  // Download Order Receipt PDF
  const handleDownloadReceipt = async (orderId) => {
    try {
      toast.loading("Downloading purchase receipt PDF...", { id: `receipt-${orderId}` });
      const response = await api.get(`/admin/inventory/orders/${orderId}/receipt`, {
        responseType: "blob"
      });

      const blob = response.data;
      if (blob.type === "application/json") {
        const text = await blob.text();
        const errObj = text ? JSON.parse(text) : {};
        throw new Error(errObj.message || "Failed to download receipt.");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `purchase_receipt_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download complete!", { id: `receipt-${orderId}` });
    } catch (err) {
      toast.error("Failed to download purchase receipt: " + (err.message || err), { id: `receipt-${orderId}` });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-xl bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <PageHeader
            title="Purchase Orders Registry"
            subtitle="Track supplier purchase orders, check receipt status, and download excel/pdf logs."
          />
        </div>

        {/* Totals Panel */}
        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total POs</span>
              <span className="text-sm font-black text-zinc-800 block mt-1">{totals.orders || 0} Orders</span>
            </div>
            <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Pending Orders</span>
              <span className="text-sm font-black text-zinc-800 block mt-1">{totals.pending || 0} Pending</span>
            </div>
            <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-violet-600 font-bold block uppercase tracking-wider">Purchase Dues</span>
              <span className="text-sm font-black text-violet-700 block mt-1">₹{totals.amount?.toLocaleString() || 0}</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">GST Accumulation</span>
              <span className="text-sm font-black text-amber-700 block mt-1">₹{totals.gst?.toLocaleString() || 0}</span>
            </div>
          </div>
        )}

        {/* Filter toolbar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search orders by PO no or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 cursor-pointer outline-none"
            >
              <option value="">All Statuses</option>
              {statuses.map(st => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Period:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1 border border-zinc-200 rounded-xl outline-none text-xs text-zinc-700 bg-zinc-50 font-bold"
              />
              <span className="text-zinc-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1 border border-zinc-200 rounded-xl outline-none text-xs text-zinc-700 bg-zinc-50 font-bold"
              />
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExport("excel")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <FaDownload className="w-2.5 h-2.5" /> Excel
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <FaDownload className="w-2.5 h-2.5" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        {listLoading ? (
          <div className="py-12"><PageLoader /></div>
        ) : orders.length === 0 ? (
          <EmptyState title="No Purchase Orders" desc="There are no purchase order logs matching your filters." />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4">PO Code Number</th>
                    <th className="px-6 py-4 text-center">Placed Dues</th>
                    <th className="px-6 py-4 text-center">GST Dues</th>
                    <th className="px-6 py-4 text-center">Total Amount</th>
                    <th className="px-6 py-4 text-center">Dues Date</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold text-zinc-600">
                  {orders.map((po) => {
                    const isExpanded = expandedOrderId === po.id;
                    const itemsList = po.items || [];
                    const canReceive = po.can_receive || po.status === "confirmed";
                    return (
                      <Fragment key={po.id}>
                        <tr className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-black text-zinc-800 uppercase">
                            {po.order_no}
                          </td>
                          <td className="px-6 py-4 text-center">₹{po.subtotal?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center text-amber-600">₹{po.gst_amount?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center font-extrabold text-violet-600">₹{po.total_amount?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center text-zinc-500 text-[10px]">{po.created_at_label || po.created_at}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black ${po.status === "received" ? "bg-emerald-50 text-emerald-700" : po.status === "cancelled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canReceive && (
                                <button
                                  onClick={() => handleReceiveOrder(po.id, po.order_no)}
                                  className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-[9px] transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1"
                                >
                                  <FaBoxes className="w-2.5 h-2.5" /> Receive Dues
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadReceipt(po.id)}
                                className="p-1.5 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-500 hover:text-violet-600 transition-all cursor-pointer"
                                title="Download Purchase Receipt PDF"
                              >
                                <FaDownload className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : po.id)}
                                className="px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1 transition-all cursor-pointer text-[10px]"
                              >
                                <FaExpand className="w-2.5 h-2.5" /> Items
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-zinc-50/20">
                            <td colSpan="7" className="px-6 py-4 border-t border-zinc-100">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                  <span>Purchase Order Items ({itemsList.length})</span>
                                  {po.notes && (
                                    <span className="normal-case text-zinc-500 font-medium italic">Notes: {po.notes}</span>
                                  )}
                                </div>

                                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                                  <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] text-zinc-400 font-extrabold uppercase">
                                        <th className="px-4 py-2">Product Name</th>
                                        <th className="px-4 py-2 text-center">Qty Ordered</th>
                                        <th className="px-4 py-2 text-center">Unit Price</th>
                                        <th className="px-4 py-2 text-center">GST %</th>
                                        <th className="px-4 py-2 text-center">GST Amount</th>
                                        <th className="px-4 py-2 text-right">Total Cost</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 font-bold text-zinc-600">
                                      {itemsList.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                                          <td className="px-4 py-2 font-bold text-zinc-800 capitalize">{item.product}</td>
                                          <td className="px-4 py-2 text-center text-zinc-800">{item.quantity}</td>
                                          <td className="px-4 py-2 text-center">₹{item.unit_price}</td>
                                          <td className="px-4 py-2 text-center text-zinc-400">{item.gst_percent}%</td>
                                          <td className="px-4 py-2 text-center text-amber-600">₹{item.gst_amount}</td>
                                          <td className="px-4 py-2 text-right text-zinc-800">₹{item.total_amount?.toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
