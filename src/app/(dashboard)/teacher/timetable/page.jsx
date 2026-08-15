"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBookOpen } from "react-icons/fa";
import { getTeacherTimetable } from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const data = await getTeacherTimetable();
        setTimetable(data);
      } catch (err) {
        toast.error("Failed to load timetable: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const daysData = timetable?.days || [];
  const byDay = timetable?.by_day || [];
  const weekLabel = timetable?.week_label || "Active Week";

  // Map days to slots conveniently
  const scheduleData = byDay.length > 0 ? byDay : daysData.map(d => ({
    key: d.key,
    label: d.label,
    date_label: d.date_label,
    slots: (timetable?.slots || []).filter(s => s.day === d.key)
  }));

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <PageHeader
        title={`Teaching Timetable (${weekLabel})`}
        subtitle="View your weekly lecture schedules, assigned subject periods, and lab hours."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scheduleData.map((dayObj) => {
          const periods = dayObj.slots || [];
          const dateLabel = dayObj.date_label || daysData.find(d => d.key === dayObj.key)?.date_label;
          return (
            <div key={dayObj.key} className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150 mb-4">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-violet-500 w-4 h-4 shrink-0" />
                    <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">{dayObj.label}</h3>
                  </div>
                  {dateLabel && (
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-500 text-[10px] font-bold rounded-lg tracking-wide whitespace-nowrap">
                      {dateLabel}
                    </span>
                  )}
                </div>

                {periods.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    No periods scheduled.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {periods.map((p, idx) => (
                      <div key={p.id || idx} className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2 hover:border-violet-300/30 transition-all text-xs">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 text-[10px] font-bold rounded-md uppercase tracking-wider whitespace-nowrap">
                            {p.time_label || `${p.start_time} – ${p.end_time}`}
                          </span>
                          {p.slot_type_label && (
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              {p.slot_type_label}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-zinc-800 flex items-center gap-1.5 capitalize">
                          <FaBookOpen className="text-zinc-400 shrink-0 w-3.5 h-3.5" />
                          {p.title || p.subject || p.slot_type_label || (p.slot_type === "lunch" ? "Lunch Break" : "Period")}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold pt-2 border-t border-zinc-150/40">
                          <span className="flex items-center gap-1 capitalize">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                            {p.class} - {p.section}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <FaMapMarkerAlt className="text-zinc-400 shrink-0 w-3 h-3" />
                            {p.room || "Room N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}