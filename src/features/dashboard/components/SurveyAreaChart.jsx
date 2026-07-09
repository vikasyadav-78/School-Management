"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function SurveyAreaChart({ data = [], height = 300 }) {
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
        <ReAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="Present"
            stroke="#7c3aed"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPresent)"
          />
          <Area
            type="monotone"
            dataKey="Late"
            stroke="#0ea5e9"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLate)"
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
