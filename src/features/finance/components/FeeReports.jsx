"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeesReport } from "../redux/financeThunk";
import PageLoader from "@/components/common/PageLoader";
import Pagination from "@/components/ui/Pagination";

export default function FeeReports() {
  const dispatch = useDispatch();
  const { feesReport: reportData, loading } = useSelector((state) => state.finance);

  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  };

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Local Filter States
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState(getThirtyDaysAgo());
  const [endDate, setEndDate] = useState(getToday());
  const [paymentStatus, setPaymentStatus] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // Dispatch reports query when class, dates, or status changes
  useEffect(() => {
    dispatch(
      fetchFeesReport({
        className: selectedClass,
        startDate,
        endDate,
        status: paymentStatus
      })
    );
    setCurrentPage(1);
  }, [selectedClass, startDate, endDate, paymentStatus, dispatch]);

  const { records = [], payments = [], summary = {} } = reportData || {};

  // Further filter records locally by student name or ID search to prevent keystroke flashing
  const filteredRecords = records.filter((rec) => {
    const term = studentSearch.toLowerCase().trim();
    return !term ||
      rec.studentName.toLowerCase().includes(term) ||
      rec.studentId.toLowerCase().includes(term);
  });

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const statusBadges = {
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Partial: "bg-amber-50 text-amber-600 border-amber-100",
    Pending: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className="space-y-6">
      {/* 1. Report Filters Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          >
            <option value="">All Classes</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Student Name</label>
          <input
            type="text"
            placeholder="Search student..."
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>
      </div>

      {/* 2. Aggregate Metrics dashboard cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Total Collection
          </span>
          <span className="text-xl font-extrabold text-zinc-800">
            ₹{(summary.totalCollection || 0).toLocaleString()}
          </span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 mb-1">
            Total Paid
          </span>
          <span className="text-xl font-extrabold text-emerald-600">
            ₹{(summary.totalPaid || 0).toLocaleString()}
          </span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 mb-1">
            Total Pending
          </span>
          <span className="text-xl font-extrabold text-rose-600">
            ₹{(summary.totalPending || 0).toLocaleString()}
          </span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 mb-1">
            Students Paid
          </span>
          <span className="text-xl font-extrabold text-emerald-600">
            {summary.studentsPaid || 0}
          </span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 mb-1">
            Students Pending
          </span>
          <span className="text-xl font-extrabold text-rose-600">
            {summary.studentsPending || 0}
          </span>
        </div>
      </div>

      {/* 3. Reports Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50">
            <h3 className="text-xs font-bold text-zinc-700">Fees Collection Report Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Student</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Class</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Total Fee</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Paid Fee</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Due Fee</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Last Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
                {paginatedRecords.map((stat) => (
                  <tr key={stat.studentId} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-zinc-800 block">{stat.studentName}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">{stat.studentId}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-zinc-700 whitespace-nowrap">Class {stat.className}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-zinc-800 whitespace-nowrap">₹{(stat.totalFee || 0).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">₹{(stat.paidAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-zinc-800 whitespace-nowrap">₹{(stat.remainingAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${statusBadges[stat.status]}`}>
                        {stat.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-zinc-400 font-semibold whitespace-nowrap">{stat.lastPaymentDate || "N/A"}</td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-zinc-400 font-medium">
                      No matching fee reports data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRecords.length > itemsPerPage && (
            <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
              <Pagination
                currentPage={currentPage}
                totalCount={filteredRecords.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
