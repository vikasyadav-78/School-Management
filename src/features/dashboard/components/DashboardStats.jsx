"use client";

import { FaUserGraduate, FaChalkboardTeacher, FaMoneyBillWave } from "react-icons/fa";
import StatCard from "@/components/cards/StatCard";

const iconMap = {
  "Total Students": FaUserGraduate,
  "New Students": FaUserGraduate,
  "Total Teachers": FaChalkboardTeacher,
  "Total Collection": FaMoneyBillWave
};

export default function DashboardStats({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = iconMap[stat.title] || FaUserGraduate;
        return (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            progress={stat.progress}
            growthText={stat.growthText}
            icon={Icon}
            color={stat.color}
            percentage={stat.percentage}
            trend={stat.trend}
          />
        );
      })}
    </div>
  );
}
