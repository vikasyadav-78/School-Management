"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaCalendarAlt, FaMapMarkerAlt, FaChalkboardTeacher } from "react-icons/fa";
import { fetchStudentTimetable } from "@/features/students/redux/studentThunk";

export default function StudentTimetablePage() {
  const dispatch = useDispatch();
  const { timetable, loading, error } = useSelector((state) => state.students);

  useEffect(() => {
    dispatch(fetchStudentTimetable());
  }, [dispatch]);

  if (loading || !timetable) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load timetable: {error}
      </div>
    );
  }

  const defaultDays = [
    { key: "Monday", label: "Monday", date_label: "" },
    { key: "Tuesday", label: "Tuesday", date_label: "" },
    { key: "Wednesday", label: "Wednesday", date_label: "" },
    { key: "Thursday", label: "Thursday", date_label: "" },
    { key: "Friday", label: "Friday", date_label: "" },
    { key: "Saturday", label: "Saturday", date_label: "" }
  ];
  const daysList = timetable.days || defaultDays;
  
  const slots = timetable.slots || [];
  const weekLabel = timetable.week_label || "Active Week";
  const className = timetable.class_name || timetable.class || "N/A";
  const sectionName = timetable.section_name || timetable.section || "N/A";

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <PageHeader
        title={`Class Timetable (${weekLabel})`}
        subtitle={`Schedule details for Class ${className}-${sectionName} • Weekly lectures, room allocations, and faculty list.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysList.map((day) => {
          const dayKey = day.key || day.label || day;
          const dayLabel = day.label || dayKey;
          const dateLabel = day.date_label || "";
          const rawPeriods = slots.filter(
            (s) => s.day?.toLowerCase() === dayKey.toLowerCase()
          );
          const periods = [...rawPeriods].sort((a, b) => {
            const tA = a.start_time || a.time || "";
            const tB = b.start_time || b.time || "";
            return tA.localeCompare(tB);
          });
          return (
            <div key={dayLabel} className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="pb-3.5 border-b border-zinc-150 mb-4">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-violet-500 w-4 h-4" />
                  <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">{dayLabel}</h3>
                </div>
                {dateLabel && (
                  <p className="text-[10px] text-zinc-400 font-bold mt-1 ml-6">{dateLabel}</p>
                )}
              </div>

              {periods.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  No Classes Scheduled
                </div>
              ) : (
                <div className="space-y-3">
                  {periods.map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 hover:border-violet-300/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[9px] font-bold rounded-md uppercase tracking-wider">
                          {p.time_label || "N/A"}
                        </span>
                        {(p.start_time || p.end_time) && (
                          <span className="text-[9px] text-zinc-400 font-extrabold">
                            {p.start_time || "N/A"} - {p.end_time || "N/A"}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        {p.subject || "N/A"}
                      </h4>
                      
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold pt-1 border-t border-zinc-100/50">
                        <span className="flex items-center gap-1">
                          <FaChalkboardTeacher className="text-zinc-400" />
                          {p.teacher || "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-zinc-400" />
                          {p.room || p.room_name || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
