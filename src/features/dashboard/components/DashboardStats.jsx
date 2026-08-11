"use client";

import { 
  FaUserGraduate, 
  FaUserPlus, 
  FaBuilding, 
  FaMoneyBillWave, 
  FaChalkboardTeacher, 
  FaUserTie, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaTimesCircle, 
  FaFileAlt 
} from "react-icons/fa";

const iconMap = {
  "Total Students": FaUserGraduate,
  "New Students": FaUserPlus,
  "Total Classes": FaBuilding,
  "Fees Collection": FaMoneyBillWave,
  "Teachers": FaChalkboardTeacher,
  "Staff": FaUserTie,
  "Present Today": FaCheckCircle,
  "Fees Due": FaExclamationCircle,
  "Absent Today": FaTimesCircle,
  "Exams This Week": FaFileAlt
};

const colorMap = {
  violet: {
    bg: "bg-violet-100/60 text-violet-600",
    border: "border-violet-100"
  },
  emerald: {
    bg: "bg-emerald-100/60 text-emerald-600",
    border: "border-emerald-100"
  },
  amber: {
    bg: "bg-amber-100/60 text-amber-600",
    border: "border-amber-100"
  },
  sky: {
    bg: "bg-sky-100/60 text-sky-600",
    border: "border-sky-100"
  }
};

export default function DashboardStats({ stats = [] }) {
  const firstRow = stats.slice(0, 4);
  const secondRow = stats.slice(4);

  const renderCard = (stat, isLarge = false) => {
    const Icon = iconMap[stat.title] || FaUserGraduate;
    const colors = colorMap[stat.color] || colorMap.violet;
    
    // Check trend directions for styling
    let trendColor = "text-zinc-400";
    if (stat.trendText) {
      if (stat.trendText.includes("↓")) {
        trendColor = "text-red-500 font-bold";
      } else if (stat.trendText.includes("↑")) {
        if (stat.trendText.includes("pending")) {
          trendColor = "text-amber-500 font-bold";
        } else {
          trendColor = "text-emerald-500 font-bold";
        }
      }
    }

    return (
      <div 
        key={stat.title}
        className={`bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md duration-300 ${isLarge ? "min-h-[110px]" : "min-h-[90px]"}`}
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.title}</p>
          <h3 className={`${isLarge ? "text-2xl" : "text-xl"} font-extrabold text-zinc-800`}>{stat.value}</h3>
          {stat.trendText && (
            <p className={`text-[10px] ${trendColor} flex items-center gap-1`}>
              {stat.trendText}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors.bg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Row 1: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {firstRow.map(stat => renderCard(stat, true))}
      </div>

      {/* Row 2: 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondRow.map(stat => renderCard(stat, true))}
      </div>
    </div>
  );
}
