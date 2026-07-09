"use client";

import { useState } from "react";
import { FaUserCircle, FaMoneyBillWave, FaSearch, FaHistory, FaTimesCircle, FaPrint } from "react-icons/fa";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import FeeReceipt from "./FeeReceipt";

export default function PendingFeesTable({ records = [], onCollect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const itemsPerPage = 8;

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      rec.studentName.toLowerCase().includes(term) ||
      rec.studentId.toLowerCase().includes(term) ||
      (rec.parentName && rec.parentName.toLowerCase().includes(term));
    const matchesClass = !selectedClass || rec.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const openHistory = (rec) => {
    setActiveHistory(rec);
    setShowHistoryModal(true);
  };

  const closeHistory = () => {
    setActiveHistory(null);
    setShowHistoryModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Panel */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search student name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-600 font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          >
            <option value="">All Classes</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">Student</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Class</th>
                <th className="px-6 py-4 whitespace-nowrap">Parent Name</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Total Fee</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Paid Fee</th>
                <th className="px-6 py-4 text-right text-rose-600 whitespace-nowrap">Due Fee</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Due Date</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-600">
              {paginatedRecords.map((rec) => (
                <tr key={rec.studentId} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-3.5 flex items-center gap-3 whitespace-nowrap">
                    <FaUserCircle className="w-8 h-8 text-zinc-300" />
                    <div>
                      <Link href={`/admin/students/profile/${rec.studentId}`} className="font-bold text-zinc-800 hover:text-violet-600">
                        {rec.studentName}
                      </Link>
                      <span className="text-[10px] text-zinc-400 block font-semibold mt-0.5">{rec.studentId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold text-zinc-700 whitespace-nowrap">Class {rec.className}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">{rec.parentName}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-zinc-800 whitespace-nowrap">₹{(rec.totalFee || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">₹{(rec.paidAmount || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-right font-extrabold text-rose-600 whitespace-nowrap">₹{(rec.remainingAmount || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center text-zinc-400 font-semibold whitespace-nowrap">{rec.dueDate}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex gap-3 justify-center items-center">
                      <button
                        onClick={() => onCollect(rec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 rounded-xl text-[10px] font-bold transition-all"
                      >
                        <FaMoneyBillWave className="w-3.5 h-3.5" />
                        <span>Collect</span>
                      </button>
                      <button
                        onClick={() => openHistory(rec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 text-zinc-600 border border-zinc-100 hover:bg-zinc-100 rounded-xl text-[10px] font-bold transition-all"
                      >
                        <FaHistory className="w-3.5 h-3.5" />
                        <span>History</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-zinc-400 font-medium">
                    No students found with pending balances.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
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

      {/* Payment History Modal Dialog */}
      {showHistoryModal && activeHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full my-auto mx-auto space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-bold text-zinc-800 text-sm">Receipt History</h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{activeHistory.studentName} ({activeHistory.studentId})</p>
              </div>
              <button onClick={closeHistory} className="text-zinc-400 hover:text-zinc-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Logs List */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {activeHistory.payments && activeHistory.payments.length > 0 ? (
                activeHistory.payments.map((p) => (
                  <div key={p.receiptNo} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-800 block">{p.receiptNo}</span>
                      <span className="text-[10px] text-zinc-400 block font-semibold">{p.paymentDate} &bull; {p.paymentMethod}</span>
                      {p.remarks && <span className="text-[10px] text-zinc-500 font-medium block italic mt-1">"{p.remarks}"</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-zinc-800">₹{(p.amount || 0).toLocaleString()}</span>
                      <button
                        onClick={() => {
                          setSelectedReceipt({
                            receiptNo: p.receiptNo,
                            studentName: activeHistory.studentName,
                            studentId: activeHistory.studentId,
                            className: activeHistory.className,
                            paymentDate: p.paymentDate,
                            paymentMethod: p.paymentMethod,
                            remarks: p.remarks,
                            amount: p.amount
                          });
                        }}
                        className="p-1.5 bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-sm print:hidden"
                        title="Print Receipt"
                      >
                        <FaPrint className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-400 font-medium">
                  No payment receipts recorded for this student.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={closeHistory}
                className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Receipt Modal Overlay from History */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0">
          <div className="max-w-md w-full my-auto mx-auto">
            <FeeReceipt 
              receipt={selectedReceipt} 
              onClear={() => setSelectedReceipt(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
