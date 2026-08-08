"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaSearch, FaDownload, FaUserGraduate, FaChevronLeft, FaPlus, FaTimes, FaClipboardList
} from "react-icons/fa";
import { 
  getInventorySales,
  getInventoryMeta,
  sellInventoryItem
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import Link from "next/link";

export default function AdminStudentSalesPage() {
  const dialog = useAppDialog();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sell form drawer/modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [metaItems, setMetaItems] = useState([]);
  const [metaStudents, setMetaStudents] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);

  // Form Fields State
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleUnitPrice, setSaleUnitPrice] = useState("");
  const [saleGstPercent, setSaleGstPercent] = useState("18");
  const [soldAt, setSoldAt] = useState(new Date().toISOString().split("T")[0]);
  const [saleNotes, setSaleNotes] = useState("");
  const [submittingSale, setSubmittingSale] = useState(false);

  const loadSales = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await getInventorySales(params);
      setSalesList(data.sales || data.data || []);
    } catch (err) {
      toast.error("Failed to load sales: " + (err.message || err));
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        loadSales();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Load Meta when modal opens
  const openSellModal = async () => {
    setIsSellModalOpen(true);
    try {
      setMetaLoading(true);
      const data = await getInventoryMeta();
      setMetaItems(data.items || []);
      setMetaStudents(data.students || []);
    } catch (err) {
      toast.error("Failed to load options: " + (err.message || err));
    } finally {
      setMetaLoading(false);
    }
  };

  // Sell Item Submit
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !selectedStudentId || !saleQuantity || !saleUnitPrice || !soldAt) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const selectedItem = metaItems.find(item => item.id === selectedItemId);
    if (selectedItem && selectedItem.quantity < parseInt(saleQuantity)) {
      toast.error(`Insufficient stock level. Only ${selectedItem.quantity} units available.`);
      return;
    }

    const isConfirmed = await dialog.confirm({
      title: "Confirm Sale Items Dues",
      message: `Are you sure you want to sell ${saleQuantity} unit(s) of "${selectedItem?.name}" to student?`,
      type: "confirm",
      confirmText: "Sell Stock",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      setSubmittingSale(true);
      await sellInventoryItem({
        inventory_item_id: selectedItemId,
        student_id: selectedStudentId,
        quantity: parseInt(saleQuantity),
        unit_price: parseFloat(saleUnitPrice),
        gst_percent: parseFloat(saleGstPercent),
        sold_at: soldAt,
        notes: saleNotes.trim() || null
      });
      toast.success("Student sale registered successfully!");
      setIsSellModalOpen(false);
      
      // Reset form
      setSelectedItemId("");
      setSelectedStudentId("");
      setSaleQuantity("1");
      setSaleUnitPrice("");
      setSaleGstPercent("18");
      setSaleNotes("");

      loadSales();
    } catch (err) {
      toast.error("Failed to record student sale: " + (err.message || err));
    } finally {
      setSubmittingSale(false);
    }
  };

  // Export Sales List Excel/PDF
  const handleExport = (format) => {
    try {
      const token = localStorage.getItem("token") || "";
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
      if (token) queryParams.append("token", token);

      const downloadUrl = `https://erp.trishpay.in/api/admin/inventory/sales/export/${format}?${queryParams.toString()}`;
      window.open(downloadUrl, "_blank");
      toast.success(`Exporting sales roster as ${format.toUpperCase()}...`);
    } catch (err) {
      toast.error("Failed to trigger sales export: " + (err.message || err));
    }
  };

  // Download sale receipt
  const handleDownloadReceipt = (saleId) => {
    try {
      const token = localStorage.getItem("token") || "";
      const downloadUrl = `https://erp.trishpay.in/api/admin/inventory/sales/${saleId}/receipt?token=${token}`;
      window.open(downloadUrl, "_blank");
      toast.success("Downloading sales receipt PDF...");
    } catch (err) {
      toast.error("Failed to download sale receipt: " + (err.message || err));
    }
  };

  // Auto-populate GST and sell price when item is selected in Sell Form
  const handleItemSelectChange = (itemId) => {
    setSelectedItemId(itemId);
    const item = metaItems.find(i => i.id === itemId);
    if (item) {
      setSaleUnitPrice(item.sell_price || item.unit_price || "");
      setSaleGstPercent(item.gst_percent !== undefined ? item.gst_percent.toString() : "18");
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
            title="Student Sales Logs"
            subtitle="View student store sales histories, issue transaction receipts, and export excel reports."
          />
        </div>

        {/* Filter toolbar */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search sales by student name, roll or receipt no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openSellModal}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FaPlus className="w-3 h-3" /> Sell Stock
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FaDownload className="w-2.5 h-2.5" /> Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FaDownload className="w-2.5 h-2.5" /> PDF
            </button>
          </div>
        </div>

        {/* Sales Table list */}
        {listLoading ? (
          <div className="py-12"><PageLoader /></div>
        ) : salesList.length === 0 ? (
          <EmptyState title="No Sales Logs" desc="No sales transaction matches your query." />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden border border-zinc-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4">Receipt No</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Stock Item Sold</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-center">Unit Price</th>
                    <th className="px-6 py-4 text-center">GST %</th>
                    <th className="px-6 py-4 text-center">Total Value</th>
                    <th className="px-6 py-4 text-center">Sold Date</th>
                    <th className="px-6 py-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold text-zinc-600">
                  {salesList.map(sale => (
                    <tr key={sale.id} className="hover:bg-zinc-50/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-black text-zinc-800 uppercase">{sale.receipt_no}</td>
                      <td className="px-6 py-4 capitalize">
                        {sale.student_name || "Guest Student"}
                        <span className="block text-[9px] text-zinc-400 tracking-wider font-bold mt-0.5">
                          {sale.class ? `${sale.class} - Sec ${sale.section}` : "No Class"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-800 capitalize">{sale.item}</td>
                      <td className="px-6 py-4 text-center text-zinc-700 font-extrabold">{sale.quantity}</td>
                      <td className="px-6 py-4 text-center">₹{sale.unit_price}</td>
                      <td className="px-6 py-4 text-center text-zinc-500">{sale.gst_percent}%</td>
                      <td className="px-6 py-4 text-center text-violet-600 font-extrabold">₹{sale.total_amount}</td>
                      <td className="px-6 py-4 text-center text-zinc-500 text-[10px]">{sale.sold_at_label}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(sale.id)}
                          className="p-1.5 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-500 hover:text-violet-600 transition-all cursor-pointer"
                          title="Download Receipt PDF"
                        >
                          <FaDownload className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sell modal form */}
        {isSellModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up text-left">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <FaUserGraduate className="text-violet-500" /> Record Student Sale
                </h3>
                <button onClick={() => setIsSellModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {metaLoading ? (
                <div className="py-12"><PageLoader /></div>
              ) : (
                <form onSubmit={handleSellSubmit} className="p-6 space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Inventory Item *</label>
                    <select
                      required
                      value={selectedItemId}
                      onChange={(e) => handleItemSelectChange(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none"
                    >
                      <option value="">Select Stock Item</option>
                      {metaItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.sku}) — {item.quantity} In Stock
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block">Target Student *</label>
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-zinc-700 font-bold outline-none"
                    >
                      <option value="">Select Student</option>
                      {metaStudents.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.full_name} ({student.class || "No Class"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 block">Qty *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={saleQuantity}
                        onChange={(e) => setSaleQuantity(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-800 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 block">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={saleUnitPrice}
                        onChange={(e) => setSaleUnitPrice(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-800 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 block">GST % *</label>
                      <input
                        type="number"
                        required
                        value={saleGstPercent}
                        onChange={(e) => setSaleGstPercent(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 block">Sale Date *</label>
                    <input
                      type="date"
                      required
                      value={soldAt}
                      onChange={(e) => setSoldAt(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 block">Notes</label>
                    <textarea
                      rows="2"
                      placeholder="Remarks..."
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none text-zinc-800 font-semibold resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSellModalOpen(false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSale}
                      className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {submittingSale ? "Selling..." : "Record Sale"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
