"use client";

import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function StatCard({
  title,
  value,
  percentage,
  trend = "up",
  icon: Icon,
  color = "violet",
  progress,
  growthText
}) {
  const colors = {
    violet: {
      bg: "bg-violet-50 text-violet-600",
      progress: "bg-violet-600",
      border: "border-violet-100",
      glow: "shadow-violet-600/5"
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600",
      progress: "bg-emerald-600",
      border: "border-emerald-100",
      glow: "shadow-emerald-600/5"
    },
    amber: {
      bg: "bg-amber-50 text-amber-600",
      progress: "bg-amber-500",
      border: "border-amber-100",
      glow: "shadow-amber-600/5"
    },
    sky: {
      bg: "bg-sky-50 text-sky-600",
      progress: "bg-sky-500",
      border: "border-sky-100",
      glow: "shadow-sky-600/5"
    }
  };

  const selectedColor = colors[color] || colors.violet;

  return (
    <div className={`bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 ${selectedColor.glow}`}>
      <div className="flex items-center justify-between">
        {/* Metric Value & Label */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-zinc-800 mt-2">{value}</h3>
        </div>

        {/* Dynamic Colored Icon */}
        <div className={`p-4 rounded-2xl ${selectedColor.bg} flex items-center justify-center`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      {/* Progress Bar (if provided) */}
      {typeof progress === "number" && (
        <div className="mt-4 space-y-1.5">
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${selectedColor.progress} transition-all duration-500`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-zinc-400 font-semibold">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Trend Percentage or Growth Text */}
      {(percentage || growthText) && (
        <div className="flex items-center gap-1.5 mt-4">
          {percentage && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}
            >
              {trend === "up" ? <FaArrowUp className="w-2.5 h-2.5" /> : <FaArrowDown className="w-2.5 h-2.5" />}
              {percentage}%
            </span>
          )}
          {growthText ? (
            <span className="text-[10px] text-zinc-400 font-semibold">{growthText}</span>
          ) : (
            <span className="text-[10px] text-zinc-400 font-medium">vs last month</span>
          )}
        </div>
      )}
    </div>
  );
}
