"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaDownload, FaBoxes, FaChevronLeft, FaExclamationTriangle
} from "react-icons/fa";
import { getInventoryDashboard } from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/services/api";

export default function AdminStockItemsPage() {
  const [loading, setLoading] = useState(true);
  const [stockList, setStockList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await getInventoryDashboard();
      setStockList(data.stock || []);
    } catch (err) {
      toast.error("Failed to load stock data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  // Filter stock by search query
  const filteredStockList = stockList.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.sku && item.sku.toLowerCase().includes(query))
    );
  });

  // Export stock handler
  const handleExport = async (format) => {
    try {
      toast.loading(`Exporting stock list as ${format.toUpperCase()}...`, { id: "export-stock" });
      const queryParams = {};
      if (searchQuery.trim()) queryParams.search = searchQuery.trim();

      const response = await api.get(`/admin/inventory/stock/export/${format}`, {
        params: queryParams,
        responseType: "blob"
      });

      const blob = response.data;
      if (blob.type === "application/json") {
        const text = await blob.text();
        const errObj = text ? JSON.parse(text) : {};
        throw new Error(errObj.message || "Failed to export stock list.");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock_export.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported stock list as ${format.toUpperCase()} successfully!`, { id: "export-stock" });
    } catch (err) {
      toast.error("Failed to trigger stock export: " + (err.message || err), { id: "export-stock" });
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

  // Count items below reorder level
  const lowStockCount = stockList.filter(item => item.quantity <= item.reorder_level).length;

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
            title="Stock Inventory Registry"
            subtitle="Monitor real-time school stock counts, receive alerts for low stock levels, and export inventory data."
          />
        </div>

        {/* Low stock warning banner */}
        {lowStockCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 font-bold">
            <FaExclamationTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <span>Attention: {lowStockCount} inventory items have reached or dropped below their reorder threshold levels. Please place purchase orders soon.</span>
            </div>
          </div>
        )}

        {/* Filter toolbar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search stock items by name, category or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("excel")}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FaDownload className="w-2.5 h-2.5" /> Export Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FaDownload className="w-2.5 h-2.5" /> Export PDF
            </button>
          </div>
        </div>

        {/* Stock Level List Table */}
        {filteredStockList.length === 0 ? (
          <EmptyState title="No Stock Items" desc="No stock inventory matches your search filter." />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4">Product SKU Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">SKU Code</th>
                    <th className="px-6 py-4 text-center">In-Stock Qty</th>
                    <th className="px-6 py-4 text-center">Reorder Threshold</th>
                    <th className="px-6 py-4 text-center">Unit Cost</th>
                    <th className="px-6 py-4 text-center">Sell Price</th>
                    <th className="px-6 py-4 text-center">GST %</th>
                    <th className="px-6 py-4 text-right">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-600 font-bold">
                  {filteredStockList.map(stock => {
                    const isLow = stock.quantity <= stock.reorder_level;
                    return (
                      <tr key={stock.id} className="hover:bg-zinc-50/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-800 capitalize flex items-center gap-2">
                          <span className="capitalize">{stock.name}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-0.5">
                              <FaExclamationTriangle className="w-2 h-2 text-amber-500" /> Low Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 capitalize text-zinc-500">{stock.category}</td>
                        <td className="px-6 py-4 text-center font-mono text-zinc-500">{stock.sku}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-black ${isLow ? "bg-rose-50 text-rose-700" : "bg-zinc-100 text-zinc-700"}`}>
                            {stock.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-zinc-400">{stock.reorder_level} units</td>
                        <td className="px-6 py-4 text-center">₹{stock.unit_price}</td>
                        <td className="px-6 py-4 text-center">₹{stock.sell_price}</td>
                        <td className="px-6 py-4 text-center text-zinc-500">{stock.gst_percent}%</td>
                        <td className="px-6 py-4 text-right text-zinc-800 font-extrabold">₹{stock.stock_value?.toLocaleString()}</td>
                      </tr>
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
