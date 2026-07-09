"use client";

import SurveyBarChart from "./SurveyBarChart";
import DonutChart from "./DonutChart";
import SurveyAreaChart from "./SurveyAreaChart";

export default function DashboardCharts({ chartData = {} }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      {/* 1. Left Chart: Student Performance Overview */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-800">Student Performance Overview</h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-1">Class-wise academic performance and progress</p>
        </div>
        <div className="mt-6">
          <SurveyBarChart data={chartData.barChart} />
        </div>
      </div>

      {/* 2. Center Chart: School Population */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-800">School Population</h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-1">Students, Teachers and Staff distribution</p>
        </div>
        <div className="mt-6">
          <DonutChart data={chartData.donutChart} />
        </div>
      </div>

      {/* 3. Right Chart: Attendance Overview */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-800">Attendance Overview</h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-1">Weekly student attendance trends</p>
        </div>
        <div className="mt-6">
          <SurveyAreaChart data={chartData.areaChart} />
        </div>
      </div>
    </div>
  );
}
