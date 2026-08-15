"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaUser, FaPrint, FaEye, FaTimes, FaCalendarAlt, FaQrcode } from "react-icons/fa";
import { fetchStudentAdmitCards, fetchStudentAdmitCardDetail, fetchStudentProfile } from "@/features/students/redux/studentThunk";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AdmitCardsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { admitCards, admitCardDetail, loadingAdmitCardDetail, loading, error, profile: studentProfile } = useSelector((state) => state.students);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [printingId, setPrintingId] = useState(null);

  useEffect(() => {
    dispatch(fetchStudentAdmitCards());
    if (!studentProfile) {
      dispatch(fetchStudentProfile());
    }
  }, [dispatch, studentProfile]);

  const handleView = (examId) => {
    setSelectedExamId(examId);
    setIsDetailOpen(true);
    dispatch(fetchStudentAdmitCardDetail(examId));
  };

  const handlePrint = async (examId) => {
    try {
      setPrintingId(examId);
      const printUrl = `/student/admit-cards/${examId}/print`;
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
      toast.error(err?.message || "Failed to load admit card layout.");
    } finally {
      setPrintingId(null);
    }
  };

  const cardsList = Array.isArray(admitCards) 
    ? admitCards 
    : (admitCards?.exams || admitCards?.admit_cards || admitCards?.data || []);

  const activeDetail = admitCardDetail?.data || admitCardDetail || {};

  // Resolve student profile photo
  const profilePhoto = studentProfile?.student?.photo || studentProfile?.user?.student?.photo || user?.student?.photo || user?.photo;

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <PageHeader 
        title="Admit Cards"
        subtitle="Download or print authorized admit cards with schedules for upcoming exam centers."
      />

      {loading && !admitCards ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold max-w-lg mx-auto mt-10">
          Failed to load admit cards: {error}
        </div>
      ) : cardsList.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-1">No Admit Cards Published</span>
          <span className="text-zinc-400 text-xs">Your exam center admit cards have not been generated yet.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cardsList.map((card, idx) => (
            <div 
              key={card.id || card.exam_id || idx} 
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group text-left"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Student" 
                      className="w-10 h-10 rounded-xl border border-zinc-200 object-cover"
                    />
                  ) : (
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100/60">
                      <FaUser className="w-5 h-5" />
                    </div>
                  )}
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-zinc-50 border border-zinc-200 text-zinc-600 uppercase tracking-wider">
                    {card.type_label || card.type || card.exam_type || "Written"}
                  </span>
                </div>

                <div className="space-y-1 mt-3">
                  <h4 className="font-bold text-zinc-900 text-sm group-hover:text-violet-600 transition-colors line-clamp-1 uppercase">
                    {card.name || card.exam_name}
                  </h4>
                  {(card.exam_center || card.center || (activeDetail.exam?.id === (card.id || card.exam_id) ? (activeDetail.schedules?.[0]?.exam_center || activeDetail.subjects?.[0]?.exam_center) : null)) ? (
                    <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1.5 pt-1">
                      <FaCalendarAlt className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Center: <span className="font-semibold text-zinc-800">{card.exam_center || card.center || (activeDetail.exam?.id === (card.id || card.exam_id) ? (activeDetail.schedules?.[0]?.exam_center || activeDetail.subjects?.[0]?.exam_center) : null)}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-3 border-t border-zinc-100">
                <button
                  onClick={() => handleView(card.exam_id || card.id)}
                  className="flex-1 px-3 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap cursor-pointer"
                >
                  <FaEye className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> View Admit Card
                </button>
                <button
                  disabled={printingId === (card.exam_id || card.id)}
                  onClick={() => handlePrint(card.exam_id || card.id)}
                  className="flex-1 px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200/60 text-violet-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs whitespace-nowrap cursor-pointer"
                >
                  {printingId === (card.exam_id || card.id) ? (
                    <div className="w-3.5 h-3.5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaPrint className="w-3.5 h-3.5 shrink-0" /> Print
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admit Card Details Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col justify-between animate-scale-up text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaUser className="text-violet-500" />
                Official Admit Card Details
              </h3>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
              {loadingAdmitCardDetail || !admitCardDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Professional School Header */}
                  <div className="border-b-2 border-dashed border-zinc-300 pb-4 text-center space-y-1 relative">
                    {activeDetail.school?.logo_url ? (
                      <img 
                        src={activeDetail.school.logo_url} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain mx-auto mb-1.5"
                      />
                    ) : null}
                    <h2 className="text-sm font-extrabold uppercase text-zinc-900 tracking-wider">
                      {activeDetail.school?.name || user?.school?.name || "Official Institution"}
                    </h2>
                    <p className="text-xs text-zinc-500 font-semibold max-w-md mx-auto">
                      {activeDetail.school?.address || "Jaipur, Rajasthan"} {activeDetail.school?.phone ? `• Phone: ${activeDetail.school.phone}` : ""}
                    </p>
                    <span className="absolute top-0 right-0 bg-zinc-100 border border-zinc-300 text-[9px] font-black uppercase text-zinc-600 px-2 py-0.5 rounded-md tracking-wider shadow-xs">
                      Official Admit Card
                    </span>
                  </div>

                  {/* Identity Grid: Photo (Left) • Info (Center) • QR Code (Right) */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-zinc-50 p-4.5 rounded-2xl border border-zinc-200/70">
                    {/* Left: Student Profile Photo */}
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                      {(activeDetail.student?.photo || activeDetail.student?.photo_url || activeDetail.student?.image || activeDetail.student?.avatar || activeDetail.student_photo || profilePhoto) ? (
                        <img 
                          src={activeDetail.student?.photo || activeDetail.student?.photo_url || activeDetail.student?.image || activeDetail.student?.avatar || activeDetail.student_photo || profilePhoto} 
                          alt="Avatar" 
                          className="w-24 h-32 rounded-xl border border-zinc-300 object-cover shadow-sm bg-white p-1"
                        />
                      ) : (
                        <div className="w-24 h-32 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-black text-2xl shadow-sm">
                          {(activeDetail.student?.name || activeDetail.student_name)?.[0] || "S"}
                        </div>
                      )}
                      <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Student Photo</span>
                    </div>

                    {/* Center: Student Info */}
                    <div className="flex-1 space-y-2 text-center md:text-left self-start pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Student Name</span>
                        <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">
                          {activeDetail.student?.name || activeDetail.student_name || "Student Name"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-zinc-600 font-semibold">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Admission Number</span>
                          <span className="text-zinc-800 font-bold font-mono">{activeDetail.student?.admission_no || activeDetail.student_id || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Roll Number</span>
                          <span className="text-zinc-800 font-bold font-mono">{activeDetail.student?.roll_no || activeDetail.student_roll_no || "N/A"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Class & Section</span>
                          <span className="text-zinc-800 font-bold">Class {(activeDetail.student?.class ?? activeDetail.class) || "N/A"} — Section {(activeDetail.student?.section ?? activeDetail.section) || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: QR Code */}
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                      <div className="p-2.5 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shadow-sm">
                        {(activeDetail.student?.qr_image || activeDetail.qr_code_url) ? (
                          <img 
                            src={activeDetail.student?.qr_image || activeDetail.qr_code_url} 
                            alt="Verification QR" 
                            className="w-20 h-20 object-contain"
                          />
                        ) : (
                          <FaQrcode className="w-16 h-16 text-zinc-400" />
                        )}
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Gate Verification</span>
                    </div>
                  </div>

                  {/* Exam Name, Type, and Range */}
                  <div className="p-4 bg-violet-50/40 border border-violet-100 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] font-extrabold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded uppercase tracking-wider">
                        {activeDetail.exam?.type_label || activeDetail.exam?.type || activeDetail.type || activeDetail.exam_type || "Written"}
                      </span>
                      <h4 className="text-xs font-black text-zinc-900 uppercase pt-1">
                        {activeDetail.exam?.name || activeDetail.name || activeDetail.exam_name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Exam Date Range</span>
                      <span className="text-zinc-800 font-bold text-xs font-mono">
                        {activeDetail.exam?.start_date || activeDetail.start_date || "N/A"} — {activeDetail.exam?.end_date || activeDetail.end_date || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Breakdown */}
                  {((activeDetail.schedules || activeDetail.subjects) && (activeDetail.schedules || activeDetail.subjects).length > 0) && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Subject Date Sheet & Location</span>
                      <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase">
                              <th className="px-4 py-2.5">Subject</th>
                              <th className="px-4 py-2.5">Exam Date</th>
                              <th className="px-4 py-2.5">Time</th>
                              <th className="px-4 py-2.5">Room</th>
                              <th className="px-4 py-2.5">Exam Center</th>
                              <th className="px-4 py-2.5 text-center">Max / Pass</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs">
                            {(activeDetail.schedules || activeDetail.subjects).map((sub, sIdx) => (
                              <tr key={sIdx} className="hover:bg-zinc-50/30 transition-colors">
                                <td className="px-4 py-2.5 font-bold text-zinc-800">{sub.subject}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-700 font-mono">{sub.exam_date_label || sub.exam_date || sub.date}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-700 font-mono">{sub.start_time} - {sub.end_time}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-700">{sub.room || "N/A"}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-700">{sub.exam_center}</td>
                                <td className="px-4 py-2.5 font-bold text-zinc-800 text-center">{sub.max_marks || "100"} / {sub.pass_marks || "33"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end shrink-0">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
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