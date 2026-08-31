"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import {
  getGlobalReports,
  getInventorySummary,
  getOnlinePayments,
  getLoginLogs
} from "@/features/super-admin/services/super-admin.service";
import {
  FaBuilding, FaUserGraduate, FaMoneyBillWave, FaShoppingCart,
  FaArrowRight, FaSignInAlt, FaFolder, FaSlidersH, FaLock, FaCog
} from "react-icons/fa";

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  // States for unified dashboard metrics
  const [reports, setReports] = useState({
    schools: 0,
    students: 0,
    teachers: 0,
    staff: 0,
    active_students: 0,
    new_admissions: 0,
    revenue: 0,
    pending_fees: 0
  });

  const [inventoryStats, setInventoryStats] = useState({
    products: 0,
    stock_units: 0,
    low_stock: 0,
    pending_orders: 0
  });

  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      setLoading(true);
      try {
        const [reportsResult, inventoryResult, paymentsResult, logsResult] = await Promise.allSettled([
          getGlobalReports(),
          getInventorySummary(),
          getOnlinePayments({ per_page: 50 }),
          getLoginLogs({ per_page: 5 })
        ]);

        if (reportsResult.status === "fulfilled") {
          const reportsRes = reportsResult.value || {};
          if (reportsRes.global || reportsRes.data) {
            setReports(reportsRes.global || reportsRes.data || {});
          }
        }
        if (inventoryResult.status === "fulfilled") {
          const inventoryRes = inventoryResult.value || {};
          if (inventoryRes.summary || inventoryRes.data) {
            setInventoryStats(inventoryRes.summary || inventoryRes.data || {});
          }
        }
        if (paymentsResult.status === "fulfilled") {
          const paymentsRes = paymentsResult.value || {};
          setPaymentsList(paymentsRes.transactions || paymentsRes.data || (Array.isArray(paymentsRes) ? paymentsRes : []));
        }
        if (logsResult.status === "fulfilled") {
          const logsRes = logsResult.value || {};
          setRecentLogs(logsRes.logs || logsRes.data || (Array.isArray(logsRes) ? logsRes : []));
        }
      } catch (err) {
        console.error("Error fetching super admin dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="super_admin">
        <div className="py-20 flex justify-center items-center">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-left w-full">
        <PageHeader
          title="Super Admin Control Panel"
          description="Global operations, platform metrics, multi-school analytics, and server integration configurations."
        />

        {/* Global KPIs Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Card 1: Schools */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Schools
              </span>
              <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                <FaBuilding />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {reports.schools}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Institutions on active plans</p>
            </div>
          </div>

          {/* Card 2: Students */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Global Enrollment
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm ring-1 ring-emerald-500/10">
                <FaUserGraduate />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {reports.students}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Active pupils across schools</p>
            </div>
          </div>

          {/* Card 3: Revenue */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Fee Revenue
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm ring-1 ring-blue-500/10">
                <FaMoneyBillWave />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                ₹{(reports.revenue || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Collected online payments</p>
            </div>
          </div>

          {/* Card 4: Inventory */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Warehouse Stock
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm ring-1 ring-amber-500/10">
                <FaShoppingCart />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {inventoryStats.stock_units}
                </h3>
                <span className="text-xs font-medium text-slate-500">Units</span>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-1">
                {inventoryStats.low_stock} items low in stock
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Recent Payments Collections List */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Recent Fee Collection
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest incoming school transactions
                </p>
              </div>
              <Link
                href="/super-admin/payments"
                className="text-violet-600 hover:text-violet-700 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
              >
                View All <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto w-full mt-4">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Receipt</th>
                    <th className="pb-3 px-3">School</th>
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 italic">
                        No recent transactions found.
                      </td>
                    </tr>
                  ) : (
                    paymentsList
                      .slice((paymentsPage - 1) * 10, paymentsPage * 10)
                      .map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3.5 pl-2 font-mono text-[11px] font-medium text-slate-500">
                            {tx.receipt_no}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            {tx.school?.name || "DPS"}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                            {tx.student_name}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-900">
                            ₹{parseFloat(tx.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 capitalize">
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 pr-2 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {tx.paid_at_label || tx.paid_at}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {paymentsList.length > 10 && (
              <div className="pt-4 border-t border-slate-100 mt-2">
                <Pagination
                  currentPage={paymentsPage}
                  totalCount={paymentsList.length}
                  pageSize={10}
                  onPageChange={setPaymentsPage}
                />
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="font-bold text-slate-900 text-base">Platform Operations</h4>
              <p className="text-xs text-slate-500 mt-0.5">Quick administrative shortcuts</p>
            </div>

            <div className="space-y-2.5 mt-4">
              <Link
                href="/super-admin/schools"
                className="group p-3 border border-slate-200/80 rounded-xl hover:border-violet-400 hover:bg-violet-50/20 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-500/10 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <FaBuilding className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-800 group-hover:text-violet-900 transition-colors">
                      Institutions Directory
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Manage school profiles & plans
                    </p>
                  </div>
                </div>
                <FaArrowRight className="w-3 h-3 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/super-admin/roles"
                className="group p-3 border border-slate-200/80 rounded-xl hover:border-violet-400 hover:bg-violet-50/20 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-500/10 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <FaLock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-800 group-hover:text-violet-900 transition-colors">
                      Roles & Security Matrix
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Spatie permissions & default toggles
                    </p>
                  </div>
                </div>
                <FaArrowRight className="w-3 h-3 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/super-admin/content"
                className="group p-3 border border-slate-200/80 rounded-xl hover:border-violet-400 hover:bg-violet-50/20 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-500/10 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <FaFolder className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-800 group-hover:text-violet-900 transition-colors">
                      Content Distribution
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload & broadcast PDFs to schools
                    </p>
                  </div>
                </div>
                <FaArrowRight className="w-3 h-3 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/super-admin/settings"
                className="group p-3 border border-slate-200/80 rounded-xl hover:border-violet-400 hover:bg-violet-50/20 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-500/10 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <FaCog className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-800 group-hover:text-violet-900 transition-colors">
                      Platform Global Settings
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      SMS, WhatsApp, and stripe secrets
                    </p>
                  </div>
                </div>
                <FaArrowRight className="w-3 h-3 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                System Login Audit Trail
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Recent user access activity across the platform
              </p>
            </div>
            <Link
              href="/super-admin/login-logs"
              className="text-violet-600 hover:text-violet-700 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            >
              View All <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto w-full mt-4">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3 min-w-[125px]">Role</th>
                  <th className="pb-3 px-3">School</th>
                  <th className="pb-3 px-3">IP Address</th>
                  <th className="pb-3 px-3 min-w-[155px]">Device / Channel</th>
                  <th className="pb-3 pr-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 italic">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-2 font-semibold text-slate-800">
                        {log.user_name}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                        {log.email}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {log.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {log.school_name || "Platform Admin"}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                        {log.ip_address}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-sky-50 border border-sky-100 text-sky-700 rounded text-[10px] font-bold uppercase mr-1.5">
                          {log.channel}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">
                          {log.device_name || "Web browser"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.created_at_label}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}