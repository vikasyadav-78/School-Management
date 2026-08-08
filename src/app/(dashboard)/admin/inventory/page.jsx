"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaBoxes, FaShoppingCart, FaClipboardList, FaFileInvoiceDollar, FaHourglassHalf, FaCheckCircle, 
  FaTimesCircle, FaPlus, FaMinus, FaShoppingBag, FaSearch, FaUserGraduate, FaChartLine, FaArrowRight
} from "react-icons/fa";
import { 
  getInventoryDashboard, 
  getInventoryCatalog, 
  placePurchaseOrder 
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminInventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "catalog"
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Purchase Order Cart State
  const [cart, setCart] = useState({}); // { [product_id]: quantity }
  const [notes, setNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch Dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getInventoryDashboard();
      setDashboardData(data);
    } catch (err) {
      toast.error("Failed to load inventory dashboard: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch Catalog products
  const loadCatalog = async () => {
    try {
      setLoading(true);
      const data = await getInventoryCatalog();
      setCatalogProducts(data.products || data.data || []);
    } catch (err) {
      toast.error("Failed to load product catalog: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      loadDashboard();
    } else if (activeTab === "catalog") {
      loadCatalog();
    }
  }, [activeTab]);

  // Cart Handlers
  const handleQuantityChange = (productId, change) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const nextCart = { ...prev };
        delete nextCart[productId];
        return nextCart;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    const items = Object.entries(cart).map(([id, qty]) => ({
      platform_product_id: id,
      quantity: qty
    }));

    if (items.length === 0) {
      toast.error("Please select at least one product from the catalog.");
      return;
    }

    try {
      setSubmittingOrder(true);
      await placePurchaseOrder({
        items,
        notes: notes.trim() || null
      });
      toast.success("Purchase order placed successfully!");
      setCart({});
      setNotes("");
      setActiveTab("overview"); // switch to overview
    } catch (err) {
      toast.error("Failed to place purchase order: " + (err.message || err));
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading && !dashboardData && catalogProducts.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardData?.stats || {};
  const stockList = dashboardData?.stock || [];
  const recentOrders = dashboardData?.recent_orders || [];
  const recentSales = dashboardData?.recent_sales || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader 
          title="School Store & Inventory"
          subtitle="Track stock levels, select available items from platform catalogs, and place supplier purchase orders."
        />

        {/* Navigation Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/inventory/stock" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center justify-between">
            <div>
              <span className="font-extrabold text-zinc-800 block">Stock Registry</span>
              <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Manage and alert stock thresholds</span>
            </div>
            <FaArrowRight className="text-zinc-300 w-3 h-3" />
          </Link>
          <Link href="/admin/inventory/purchases" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center justify-between">
            <div>
              <span className="font-extrabold text-zinc-800 block">Purchase Orders</span>
              <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Track and receive supplier orders</span>
            </div>
            <FaArrowRight className="text-zinc-300 w-3 h-3" />
          </Link>
          <Link href="/admin/inventory/sales" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center justify-between">
            <div>
              <span className="font-extrabold text-zinc-800 block">Student Sales</span>
              <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Record and view student sales logs</span>
            </div>
            <FaArrowRight className="text-zinc-300 w-3 h-3" />
          </Link>
          <Link href="/admin/inventory/reports" className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center justify-between">
            <div>
              <span className="font-extrabold text-zinc-800 block">Inventory Reports</span>
              <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Analyze profit & turnover metrics</span>
            </div>
            <FaArrowRight className="text-zinc-300 w-3 h-3" />
          </Link>
        </div>

        {/* Tab Headers */}
        <div className="bg-white border border-zinc-200 p-1.5 rounded-2xl shadow-sm flex gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "overview" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaBoxes className="w-3.5 h-3.5" /> Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 ${activeTab === "catalog" ? "bg-violet-600 text-white shadow-sm" : "hover:bg-zinc-50 text-zinc-600"}`}
          >
            <FaShoppingCart className="w-3.5 h-3.5" /> Platform Catalog
          </button>
        </div>

        {/* ========================================================
            TAB 1: OVERVIEW DASHBOARD
            ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Stock SKU Items</span>
                <span className="text-sm font-black text-zinc-800 block mt-1">{stats.items || 0} Categories</span>
              </div>
              <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">In-Stock Units</span>
                <span className="text-sm font-black text-zinc-800 block mt-1">{stats.stock_units || 0} Pieces</span>
              </div>
              <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] text-violet-600 font-bold block uppercase tracking-wider">Purchase Dues</span>
                <span className="text-sm font-black text-violet-700 block mt-1">₹{stats.purchase_total?.toLocaleString() || 0}</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">Store Sales</span>
                <span className="text-sm font-black text-emerald-700 block mt-1">₹{stats.sales_total?.toLocaleString() || 0}</span>
              </div>
            </div>

            {/* Stock Level Preview */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                <h4 className="font-extrabold text-zinc-800 text-xs">Current Stock Valuation</h4>
                <Link href="/admin/inventory/stock" className="text-violet-600 hover:text-violet-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  View Full Stock <FaArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              {stockList.length === 0 ? (
                <div className="p-8 text-center italic text-zinc-400">No stock item listed in inventory.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
                        <th className="px-6 py-3.5">Product SKU Name</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5 text-center">SKU Code</th>
                        <th className="px-6 py-3.5 text-center">In-Stock Qty</th>
                        <th className="px-6 py-3.5 text-center">Unit Cost</th>
                        <th className="px-6 py-3.5 text-center">Sell Price</th>
                        <th className="px-6 py-3.5 text-center">GST %</th>
                        <th className="px-6 py-3.5 text-right">Stock Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-600 font-bold">
                      {stockList.slice(0, 5).map(stock => (
                        <tr key={stock.id} className="hover:bg-zinc-50/40 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-zinc-800 capitalize">{stock.name}</td>
                          <td className="px-6 py-3.5 capitalize text-zinc-500">{stock.category}</td>
                          <td className="px-6 py-3.5 text-center font-mono text-zinc-500">{stock.sku}</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded font-black ${stock.quantity <= stock.reorder_level ? "bg-rose-50 text-rose-700" : "bg-zinc-100 text-zinc-700"}`}>
                              {stock.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">₹{stock.unit_price}</td>
                          <td className="px-6 py-3.5 text-center">₹{stock.sell_price}</td>
                          <td className="px-6 py-3.5 text-center text-zinc-500">{stock.gst_percent}%</td>
                          <td className="px-6 py-3.5 text-right text-zinc-800 font-extrabold">₹{stock.stock_value?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Orders & Recent Sales logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              {/* Recent Orders */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-zinc-800 text-xs">Recent Purchase Dues</h4>
                  <Link href="/admin/inventory/purchases" className="text-violet-600 hover:text-violet-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    All Orders <FaArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center italic text-zinc-400">No purchase order placed yet.</div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {recentOrders.slice(0, 3).map(order => (
                      <div key={order.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/20 transition-colors">
                        <div>
                          <span className="font-extrabold text-zinc-800 block uppercase font-mono">{order.order_no}</span>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mt-0.5">
                            Created: {order.created_at_label} • {order.items?.length || 0} Item(s)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-zinc-800">₹{order.total_amount?.toLocaleString()}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black ${order.status === "received" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Sales */}
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-zinc-800 text-xs">Recent Student Sales Dues</h4>
                  <Link href="/admin/inventory/sales" className="text-violet-600 hover:text-violet-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    All Sales <FaArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
                {recentSales.length === 0 ? (
                  <div className="p-8 text-center italic text-zinc-400">No student sales transactions.</div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {recentSales.slice(0, 3).map(sale => (
                      <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/20 transition-colors">
                        <div>
                          <span className="font-bold text-zinc-800 block capitalize">{sale.item}</span>
                          <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mt-0.5">
                            Sold To: {sale.student_name || "Guest student"} ({sale.class || "N/A"})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-zinc-800">₹{sale.total_amount?.toLocaleString()}</span>
                          <span className="text-[10px] text-zinc-500 font-bold block">Qty: {sale.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: PRODUCT CATALOG & PLACE ORDER
            ======================================================== */}
        {activeTab === "catalog" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left animate-fade-in">
            {/* Catalog Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-zinc-800 text-sm">Available Platform Products</h3>

              {catalogProducts.length === 0 ? (
                <EmptyState title="No Products in Catalog" desc="There are no products listed in the platform catalog." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogProducts.map(prod => {
                    const cartQty = cart[prod.id] || 0;

                    return (
                      <div key={prod.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h4 className="font-extrabold text-zinc-800 text-sm capitalize">{prod.name}</h4>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{prod.category}</span>
                            </div>
                            <span className="font-mono text-[9px] text-zinc-500 uppercase bg-zinc-100 px-2 py-0.5 rounded">SKU: {prod.sku}</span>
                          </div>

                          {prod.description && (
                            <p className="text-zinc-500 font-medium text-[11px] line-clamp-2 leading-relaxed mb-3">{prod.description}</p>
                          )}

                          <div className="space-y-1 text-[10px] font-bold text-zinc-600 pb-3 mb-3 border-b border-zinc-100">
                            <div className="flex justify-between items-center">
                              <span>Standard Sell Price:</span>
                              <span className="text-zinc-800 font-black">₹{prod.sell_price}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>GST Charge Percent:</span>
                              <span className="text-zinc-500">{prod.gst_percent}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Total Cost (with GST):</span>
                              <span className="text-violet-600 font-black">₹{prod.price_with_gst}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Incrementer */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Quantity</span>
                          <div className="flex items-center gap-2">
                            {cartQty > 0 && (
                              <>
                                <button
                                  onClick={() => handleQuantityChange(prod.id, -1)}
                                  className="w-7 h-7 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <FaMinus className="w-2.5 h-2.5" />
                                </button>
                                <span className="font-extrabold text-zinc-800 text-sm px-2">{cartQty}</span>
                              </>
                            )}
                            <button
                              onClick={() => handleQuantityChange(prod.id, 1)}
                              className="w-7 h-7 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <FaPlus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Checkout Panel */}
            <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="font-extrabold text-zinc-800 text-sm mb-4 border-b border-zinc-100 pb-3 flex items-center gap-1.5">
                <FaShoppingBag className="text-violet-500" /> Checkout Purchase Order
              </h3>

              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4 text-xs font-semibold">
                {Object.keys(cart).length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 italic">No products added. Add items from the catalog to place an order.</div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {Object.entries(cart).map(([id, qty]) => {
                        const product = catalogProducts.find(p => p.id === id) || {};
                        return (
                          <div key={id} className="flex justify-between items-center bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                            <div>
                              <span className="font-extrabold text-zinc-800 block capitalize">{product.name}</span>
                              <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider mt-0.5">₹{product.price_with_gst} per unit</span>
                            </div>
                            <span className="font-black text-violet-600 text-xs">x {qty}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Order Notes (Optional)</label>
                      <textarea
                        rows="3"
                        placeholder="Add special instructions, invoice details, supplier requests..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl outline-none focus:border-violet-500 text-zinc-800 font-semibold resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all text-xs"
                    >
                      {submittingOrder ? "Placing Order..." : "Place Purchase Order"}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
