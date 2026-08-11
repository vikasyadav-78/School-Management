"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function SurveyBarChart({ data = [], height = 300 }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height }} className="animate-pulse bg-zinc-50 rounded-2xl w-full flex items-center justify-center text-xs text-zinc-400 font-semibold">
        Loading chart content...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ReBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #f4f4f5",
              fontSize: "11px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }} />
          {data.length > 0 && Object.keys(data[0]).filter(k => k !== "name").map((key, idx) => {
            const colors = ["#f59e0b", "#7c3aed", "#10b981", "#06b6d4", "#ec4899", "#6366f1"];
            return (
              <Bar 
                key={key} 
                dataKey={key} 
                name={key.charAt(0).toUpperCase() + key.slice(1)} 
                fill={colors[idx % colors.length]} 
                radius={[4, 4, 0, 0]} 
              />
            );
          })}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
