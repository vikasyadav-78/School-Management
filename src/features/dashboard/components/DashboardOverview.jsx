"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getChartData, getStudentList } from "../services/dashboard.service";
import DashboardStats from "./DashboardStats";
import DashboardCharts from "./DashboardCharts";
import DashboardStudentTable from "./DashboardStudentTable";
import PageLoader from "@/components/common/PageLoader";
import ErrorState from "@/components/common/ErrorState";

// Import Async Thunks for Redux State Synchronization
import { fetchTeachersList } from "@/features/teachers/redux/teacherThunk";
import { fetchStudentsList } from "@/features/students/redux/studentThunk";
import { fetchTotalCollection } from "@/features/finance/redux/financeThunk";

// Import Selectors for Live Dashboard Calculations
import { selectTotalStudents, selectNewStudents } from "@/features/students/redux/studentSlice";
import { selectTotalTeachers } from "@/features/teachers/redux/teacherSlice";
import { selectTotalCollection } from "@/features/finance/redux/financeSlice";

export default function DashboardOverview() {
  const dispatch = useDispatch();
  const [data, setData] = useState({ chartData: {}, studentList: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve dynamic statistics using Redux Selectors
  const totalStudents = useSelector(selectTotalStudents);
  const newStudents = useSelector(selectNewStudents);
  const totalTeachers = useSelector(selectTotalTeachers);

  const totalCollection = useSelector(selectTotalCollection);

  const stats = [
    {
      id: 1,
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      progress: 76,
      growthText: "Active admissions",
      color: "violet",
      trend: "up",
      percentage: "15"
    },
    {
      id: 2,
      title: "New Students",
      value: newStudents.toLocaleString(),
      progress: 42,
      growthText: "Enrolled in 2025/2026",
      color: "emerald",
      trend: "up",
      percentage: "8"
    },
    {
      id: 3,
      title: "Total Teachers",
      value: totalTeachers.toLocaleString(),
      progress: 60,
      growthText: "Optimal ratio",
      color: "amber",
      trend: "up",
      percentage: "0"
    },
    {
      id: 4,
      title: "Total Collection",
      value: `₹${totalCollection.toLocaleString()}`,
      progress: 88,
      growthText: "Paid fee payments",
      color: "sky",
      trend: "up",
      percentage: "24"
    }
  ];

  // Dynamically inject live population counts into Donut Chart
  const chartData = {
    ...data.chartData,
    donutChart: [
      { name: "Teachers", value: totalTeachers },
      { name: "Students", value: totalStudents },
      { name: "Staff", value: 65 }
    ]
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrently load all remaining features into Redux without blocking on failures
      await Promise.allSettled([
        dispatch(fetchTeachersList()),
        dispatch(fetchStudentsList()),
        dispatch(fetchTotalCollection())
      ]);

      // Load specific student list and performance chart metrics
      const [chartsRes, studentsRes] = await Promise.all([
        getChartData(),
        getStudentList()
      ]);

      setData({
        chartData: chartsRes.data,
        studentList: studentsRes.data
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState onRetry={loadDashboardData} desc={error} />;

  return (
    <div className="space-y-6">
      {/* 1. Statistics Row */}
      <DashboardStats stats={stats} />

      {/* 2. Visual Charts Row */}
      <DashboardCharts chartData={chartData} />

      {/* 3. New Admissions Students Table */}
      <DashboardStudentTable students={data.studentList} />
    </div>
  );
}
