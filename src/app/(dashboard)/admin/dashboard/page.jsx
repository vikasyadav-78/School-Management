"use client";

import { useState } from "react";
import { APP_CONFIG } from "@/constants/appConfig";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import DashboardOverview from "@/features/dashboard/components/DashboardOverview";

export default function AdminDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-08");

  const monthFilter = (
    <div className="flex items-center gap-2">
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value || "2026-08")}
        className="px-4 py-2 border border-zinc-200 rounded-xl bg-white text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={APP_CONFIG.homePageTitle} 
          subtitle={`Welcome back, Administrator! Here is the latest ${APP_CONFIG.schoolName} academic snapshot.`}
          action={monthFilter}
        />
        <DashboardOverview selectedMonth={selectedMonth} />
      </div>
    </DashboardLayout>
  );
}
