"use client";

import { useMemo } from "react";

export default function AttendanceSummary({ records = [], totalLabel = "Total Students" }) {
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfDay = 0;

    records.forEach((r) => {
      if (r.status === "Present") present++;
      else if (r.status === "Absent") absent++;
      else if (r.status === "Leave" || r.status === "Paid Leave" || r.status === "Unpaid Leave") leave++;
      else if (r.status === "Half Day") halfDay++;
    });

    return {
      total: records.length,
      present,
      absent,
      leave,
      halfDay
    };
  }, [records]);

  const cards = [
    {
      title: totalLabel,
      value: stats.total,
      color: "zinc",
      bgClass: "bg-zinc-50 border-zinc-200 text-zinc-800 shadow-sm"
    },
    {
      title: "Present",
      value: stats.present,
      color: "emerald",
      bgClass: "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm"
    },
    {
      title: "Absent",
      value: stats.absent,
      color: "rose",
      bgClass: "bg-rose-50 border-rose-100 text-rose-600 shadow-sm"
    }
  ];

  if (totalLabel === "Total Teachers") {
    cards.push({
      title: "Half Day",
      value: stats.halfDay,
      color: "blue",
      bgClass: "bg-blue-50 border-blue-100 text-blue-600 shadow-sm"
    });
  }

  cards.push({
    title: "Leave",
    value: stats.leave,
    color: "amber",
    bgClass: "bg-amber-50 border-amber-100 text-amber-600 shadow-sm"
  });

  const gridCols = totalLabel === "Total Teachers" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {cards.map((c) => (
        <div
          key={c.title}
          className={`p-4 rounded-2xl border ${c.bgClass} flex flex-col items-center justify-center text-center shadow-sm whitespace-nowrap`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1 whitespace-nowrap">
            {c.title}
          </span>
          <span className="text-xl font-extrabold whitespace-nowrap">{c.value}</span>
        </div>
      ))}
    </div>
  );
}
