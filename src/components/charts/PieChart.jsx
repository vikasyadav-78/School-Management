"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

export default function PieChart({ data = [], nameKey = "name", valueKey = "value", height = 300 }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="animate-pulse bg-zinc-50 rounded-2xl w-full flex items-center justify-center text-xs text-zinc-400 font-semibold"
      >
        Loading chart content...
      </div>
    );
  }

  const colors = ["#7c3aed", "#10b981", "#f59e0b", "#0ea5e9", "#ec4899"];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #f4f4f5",
              fontSize: "11px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}
