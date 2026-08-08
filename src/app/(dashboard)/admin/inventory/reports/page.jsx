"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaChartBar, FaChartLine, FaArrowCircleUp, FaArrowCircleDown, FaClipboardList, FaBoxes, FaChevronLeft
} from "react-icons/fa";
import { getInventoryReport } from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminInventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await getInventoryReport();
      setReportData(data);
    } catch (err) {
      toast.error("Failed to load inventory report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <EmptyState title="No Report Data" desc="Failed to generate inventory analytical report." />
      </DashboardLayout>
    );
  }

  const stats = reportData.stats || {};
  const stockList = reportData.stock || [];
  const recentOrders = reportData.recent_orders || [];
  const recentSales = reportData.recent_sales || [];

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
            title="Inventory Reports & Analytics"
            subtitle="Analyze overall school stock sales vs purchase orders, cost allocations, and profit summaries."
          />
        </div>

        {/* 1. Stats Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Suppliers Purchase Dues</span>
            <span className="text-sm font-black text-zinc-800 block mt-1">₹{stats.purchase_total?.toLocaleString() || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Student Sales Total</span>
            <span className="text-sm font-black text-emerald-600 block mt-1">₹{stats.sales_total?.toLocaleString() || 0}</span>
          </div>
          <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Valuation of Stock</span>
            <span className="text-sm font-black text-violet-600 block mt-1">₹{stats.stock_value?.toLocaleString() || 0}</span>
          </div>
          <div className={`p-4 rounded-2xl border shadow-sm ${stats.profit >= 0 ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" : "bg-rose-50/50 border-rose-100 text-rose-800"}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider block">Valuation Net Profit</span>
            <span className="text-sm font-black block mt-1">₹{stats.profit?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* 2. Purchase vs Sales comparison list */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h4 className="font-extrabold text-zinc-800 text-xs flex items-center gap-1.5 border-b border-zinc-100 pb-3">
            <FaChartBar className="text-violet-500 w-3.5 h-3.5" /> Purchase orders vs Student Sales comparisons
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Store Sales Count</span>
              <span className="text-sm font-black text-zinc-800 block mt-1">{stats.sales_units || 0} units sold</span>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Sales Cost Value</span>
              <span className="text-sm font-black text-zinc-800 block mt-1">₹{stats.sales_cost?.toLocaleString() || 0}</span>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">GST Accumulation</span>
              <span className="text-sm font-black text-zinc-800 block mt-1">₹{stats.sales_gst?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* 3. Items Sold vs Available Stock levels */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-100">
            <h4 className="font-extrabold text-zinc-800 text-xs">Stock Items Turnover Analytics</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Product SKU Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-center">SKU Code</th>
                  <th className="px-6 py-3.5 text-center">Sold Units</th>
                  <th className="px-6 py-3.5 text-center">Available Stock Qty</th>
                  <th className="px-6 py-3.5 text-center">Unit Cost</th>
                  <th className="px-6 py-3.5 text-center">Sell Price</th>
                  <th className="px-6 py-3.5 text-right">Available Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-600 font-bold">
                {stockList.map(stock => (
                  <tr key={stock.id} className="hover:bg-zinc-50/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-zinc-800 capitalize">{stock.name}</td>
                    <td className="px-6 py-3.5 capitalize text-zinc-500">{stock.category}</td>
                    <td className="px-6 py-3.5 text-center font-mono text-zinc-500">{stock.sku}</td>
                    <td className="px-6 py-3.5 text-center text-emerald-600 font-extrabold">{stock.sold_qty || 0} unit(s)</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded font-black ${stock.quantity <= stock.reorder_level ? "bg-rose-50 text-rose-700" : "bg-zinc-100 text-zinc-700"}`}>
                        {stock.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">₹{stock.unit_price}</td>
                    <td className="px-6 py-3.5 text-center">₹{stock.sell_price}</td>
                    <td className="px-6 py-3.5 text-right text-zinc-800 font-extrabold">₹{stock.stock_value?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
