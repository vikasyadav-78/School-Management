"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaCalendarAlt, FaChevronDown, FaChevronUp, FaBook, FaMapMarkerAlt } from "react-icons/fa";
import { fetchStudentExamSchedule } from "@/features/students/redux/studentThunk";

export default function ExamSchedulePage() {
  const dispatch = useDispatch();
  const { examSchedule, loading, error } = useSelector((state) => state.students);
  const [expandedExamId, setExpandedExamId] = useState(null);

  useEffect(() => {
    dispatch(fetchStudentExamSchedule());
  }, [dispatch]);

  const toggleExpand = (id) => {
    setExpandedExamId(expandedExamId === id ? null : id);
  };

  if (loading && !examSchedule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load exam schedule: {error}
      </div>
    );
  }

  const examsList = Array.isArray(examSchedule)
    ? examSchedule
    : (examSchedule?.exams || examSchedule?.data || []);

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <PageHeader
        title="Examination Schedule"
        description="View dates, timings, venues, and mark structures for your upcoming term examinations."
      />

      {examsList.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-zinc-200 shadow-sm text-center">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-xs block mb-1">
            No Exam Schedule Available
          </span>
          <span className="text-zinc-400 text-xs">
            No timetables have been published for examinations at this moment.
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {examsList.map((exam, idx) => {
            const isExpanded = expandedExamId === (exam.id || exam.exam_id);
            const subjects = exam.subjects || [];

            return (
              <div
                key={exam.id || exam.exam_id || idx}
                className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Accordion Trigger Header */}
                <div
                  onClick={() => toggleExpand(exam.id || exam.exam_id)}
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl border border-violet-100/60 shrink-0">
                      <FaCalendarAlt className="w-5 h-5" />
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                        {exam.name || exam.title}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 font-semibold">
                        <span>Type: <strong className="text-zinc-750 capitalize">{exam.type || exam.exam_type || "Written"}</strong></span>
                        <span>Start: <strong className="text-zinc-750 font-mono">{exam.start_date || "N/A"}</strong></span>
                        <span>End: <strong className="text-zinc-750 font-mono">{exam.end_date || "N/A"}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {exam.is_published ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider">
                        Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-500 uppercase tracking-wider">
                        Draft
                      </span>
                    )}
                    {isExpanded ? (
                      <FaChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <FaChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Subject Schedule Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-150 p-6 bg-zinc-50/30 text-left animate-slide-down">
                    {subjects.length === 0 ? (
                      <div className="text-center py-6 text-zinc-400 font-bold uppercase tracking-wider text-xs">
                        No subject schedules configured.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-white border border-zinc-200 rounded-2xl p-4.5 shadow-sm space-y-3 relative overflow-hidden"
                          >
                            {/* Subject Header */}
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <span className="text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                  {sub.subject || "Coursework"}
                                </span>
                                <h5 className="font-bold text-zinc-900 text-sm mt-1.5 line-clamp-1">
                                  {sub.subject_name || sub.subject}
                                </h5>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  Passing / Max
                                </span>
                                <span className="font-extrabold text-zinc-800 text-xs mt-0.5 block">
                                  {sub.pass_marks || "N/A"} / {sub.max_marks || "N/A"}
                                </span>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-y-2 gap-x-3 pt-2.5 border-t border-zinc-100 text-xs text-zinc-600">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>Date: <strong className="text-zinc-800 font-mono">{sub.exam_date || sub.date || "N/A"}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaBook className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>Time: <strong className="text-zinc-800 font-mono">{sub.start_time || "N/A"} - {sub.end_time || "N/A"}</strong></span>
                              </div>
                              <div className="flex items-center gap-2 col-span-2">
                                <FaMapMarkerAlt className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>Room / Venue: <strong className="text-zinc-800">{sub.room || "N/A"} - {sub.exam_center || "Main Campus"}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}