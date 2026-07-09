"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaFileAlt, FaPrint, FaEye, FaTimes, FaCalendarAlt } from "react-icons/fa";
import { fetchStudentReportCards, fetchStudentReportCardDetail } from "@/features/students/redux/studentThunk";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function ReportCardsPage() {
  const dispatch = useDispatch();
  const { reportCards, reportCardDetail, loadingReportCardDetail, loading, error } = useSelector((state) => state.students);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [printingId, setPrintingId] = useState(null);

  useEffect(() => {
    dispatch(fetchStudentReportCards());
  }, [dispatch]);

  const handleView = (examId) => {
    setSelectedExamId(examId);
    setIsDetailOpen(true);
    dispatch(fetchStudentReportCardDetail(examId));
  };

  const handlePrint = async (examId) => {
    try {
      setPrintingId(examId);
      const printUrl = `/student/report-cards/${examId}/print`;
      const response = await api.get(printUrl, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "text/html" });
      const blobUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, "_blank");
      if (newTab) {
        newTab.focus();
      } else {
        toast.error("Popup blocked! Please allow popups for this site.");
      }
    } catch (err) {
      console.error("Print error:", err);
      toast.error(err?.message || "Failed to load report card layout.");
    } finally {
      setPrintingId(null);
    }
  };

  const cardsList = Array.isArray(reportCards) 
    ? reportCards 
    : (reportCards?.report_cards || reportCards?.data || []);

  const activeDetail = reportCardDetail?.report_card || reportCardDetail?.data || reportCardDetail || {};

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <PageHeader 
        title="Report Cards"
        subtitle="View summaries, passing scores, teacher feedback remarks, and print formal report cards."
      />

      {loading && !reportCards ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
          Failed to load report cards: {error}
        </div>
      ) : cardsList.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-2">No Report Cards Available</span>
          <span className="text-zinc-400/80 text-[10px]">Your report cards have not been published for downloading yet.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardsList.map((card) => (
            <div 
              key={card.id} 
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group text-left"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                    <FaFileAlt className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-zinc-50 border border-zinc-200 text-zinc-650 uppercase tracking-wider">
                    {card.type || card.exam_type || "Written"}
                  </span>
                </div>

                <div className="space-y-1 mt-3">
                  <h4 className="font-extrabold text-zinc-850 text-sm group-hover:text-violet-600 transition-colors line-clamp-1 uppercase">
                    {card.name || card.exam_name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5 pt-1">
                    <FaCalendarAlt className="w-3.5 h-3.5" /> Date: {card.date_range || `${card.start_date || "N/A"} - ${card.end_date || "N/A"}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-3 border-t border-zinc-100">
                <button
                  onClick={() => handleView(card.exam_id || card.id)}
                  className="flex-1 px-3 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <FaEye className="w-3.5 h-3.5" /> View
                </button>
                <button
                  disabled={printingId === (card.exam_id || card.id)}
                  onClick={() => handlePrint(card.exam_id || card.id)}
                  className="flex-1 px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200/50 text-violet-600 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {printingId === (card.exam_id || card.id) ? (
                    <div className="w-3.5 h-3.5 border-2 border-violet-650 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaPrint className="w-3.5 h-3.5" /> Print
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Card Details Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col justify-between animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-850 text-sm flex items-center gap-2">
                <FaFileAlt className="text-violet-500" />
                Report Card Summary
              </h3>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
              {loadingReportCardDetail || !reportCardDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-violet-650 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {activeDetail.type || activeDetail.exam_type || "Written"}
                      </span>
                      <h2 className="text-base font-extrabold text-zinc-850 leading-tight mt-2 uppercase">
                        {activeDetail.name || activeDetail.exam_name}
                      </h2>
                    </div>
                  </div>

                  {/* Summary Block */}
                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Percentage Obtained</span>
                      <span className="font-extrabold text-zinc-855 text-sm">{activeDetail.percentage || "N/A"}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Final Grade / Status</span>
                      <span className="font-extrabold text-zinc-855 text-sm capitalize">{activeDetail.grade || "N/A"} ({activeDetail.status || "Pass"})</span>
                    </div>
                  </div>

                  {/* Marks breakdowns if available */}
                  {activeDetail.subjects && activeDetail.subjects.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Subjects Marks Breakdown</span>
                      <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-bold text-zinc-400 uppercase">
                              <th className="px-4 py-2.5">Subject</th>
                              <th className="px-4 py-2.5">Marks Obtained</th>
                              <th className="px-4 py-2.5">Maximum Marks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-150 text-[10px]">
                            {activeDetail.subjects.map((sub, sIdx) => (
                              <tr key={sIdx}>
                                <td className="px-4 py-2.5 font-bold text-zinc-700">{sub.subject || sub.subject_name}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-650">{sub.marks ?? "—"}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-650">{sub.max_marks ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeDetail.remarks && (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">Teacher Feedback Remarks</span>
                      <p className="text-zinc-755 font-bold text-xs">{activeDetail.remarks}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-150 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
