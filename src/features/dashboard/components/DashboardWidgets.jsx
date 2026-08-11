"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardWidgets({ 
  incomeExpenseData = [], 
  notices = [], 
  leaves = [], 
  holidays = [], 
  selectedMonth = "2026-08" 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe helper to get initial letter
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  // Mini Calendar Calculations for Selected Month (Default August 2026)
  const renderCalendar = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" });
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    const days = [];
    // Padding for empty space before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<span key={`empty-${i}`} className="w-6 h-6 inline-block"></span>);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelectedDay = d === 10; // August 10, 2026 highlights in screenshot
      days.push(
        <span 
          key={d} 
          className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-full cursor-pointer transition-all ${
            isSelectedDay 
              ? "bg-violet-600 text-white shadow-sm" 
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {d}
        </span>
      );
    }

    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50">
        <h4 className="text-xs font-bold text-zinc-700 mb-2">{monthName} {year}</h4>
        <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[9px] font-extrabold text-zinc-400">
          {weekdays.map(w => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* CARD 1: Income vs Expense Chart */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
        <div>
          <h3 className="text-sm font-bold text-zinc-800 mb-4">Income vs Expense</h3>
          {mounted ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: "1px solid #e4e4e7" }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 10, paddingBottom: 10 }} />
                  <Area type="monotone" dataKey="Collected" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                  <Area type="monotone" dataKey="Pending" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPending)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] bg-zinc-50 rounded-xl animate-pulse" />
          )}
        </div>
      </div>

      {/* CARD 2: Notice Board */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-800">Notice Board</h3>
            <Link href="/admin/notices" className="text-xs font-bold text-violet-600 hover:text-violet-700">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {notices.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No notices posted for the selected period.</p>
            ) : (
              notices.map((notice, idx) => (
                <div key={idx} className="flex gap-3 items-start border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitial(notice.author || notice.created_by_name || "Admin")}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800">{notice.author || notice.created_by_name || "Admin"}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">{notice.title || notice.content}</p>
                    <span className="text-[9px] text-zinc-400 font-semibold block mt-1">
                      {notice.date || (notice.created_at ? new Date(notice.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CARD 3: Leave Requests */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-800">Leave Requests</h3>
            <Link href="/admin/leaves" className="text-xs font-bold text-violet-600 hover:text-violet-700">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {leaves.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No pending leave requests.</p>
            ) : (
              leaves.map((leave, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl bg-zinc-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitial(leave.student_name || leave.teacher_name || leave.user_name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">{leave.student_name || leave.teacher_name || leave.user_name}</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                        {leave.user_type || "Student"} • {leave.days || 1} day(s)
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100">
                    {leave.status || "Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CARD 4: Upcoming Events Calendar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
        <div>
          <h3 className="text-sm font-bold text-zinc-800 mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {renderCalendar()}

            <div className="flex items-center gap-4 text-[9px] font-extrabold text-zinc-400 pl-1">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Exam</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-600"></span> Holiday</span>
            </div>

            <div className="pt-2 border-t border-zinc-100 text-zinc-500 font-medium text-xs">
              <h4 className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2">Upcoming Events</h4>
              {holidays.length === 0 ? (
                <p className="text-xs text-zinc-400 py-1 font-medium">No upcoming events this month.</p>
              ) : (
                <div className="space-y-1.5">
                  {holidays.slice(0, 2).map((h, index) => (
                    <p key={index} className="text-xs font-semibold text-zinc-700">
                      • {h.name || h.title} ({h.date || (h.start_date ? new Date(h.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—")})
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
