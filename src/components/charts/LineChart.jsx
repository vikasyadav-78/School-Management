"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function LineChart({ data = [], xKey, yKeys = [], height = 300 }) {
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

  const colors = ["#7c3aed", "#10b981", "#f59e0b", "#0ea5e9"];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ReLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey={xKey} stroke="#a1a1aa" fontSize={10} tickLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #f4f4f5",
              fontSize: "11px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
          {yKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{ strokeWidth: 2, r: 4 }}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
