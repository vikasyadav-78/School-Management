"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/common/EmptyState";
import { FaSearch, FaChevronRight, FaUsers, FaUserCheck, FaChalkboardTeacher } from "react-icons/fa";
import { fetchStudentsMeta } from "@/features/students/redux/studentThunk";

export default function StudentsClassDirectoryPage() {
  const dispatch = useDispatch();
  const { classSummaries, loading } = useSelector((state) => state.students);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchStudentsMeta());
  }, [dispatch]);

  // Real-time Class Card search filtering
  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return classSummaries;

    return classSummaries.filter((cls) => {
      const clsNameStr = String(cls.className).toLowerCase();
      const fullLabel = `class ${clsNameStr}`;
      return clsNameStr.includes(query) || fullLabel.includes(query);
    });
  }, [classSummaries, searchQuery]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Students Directory"
        subtitle="Manage student details, classes, and sections for the academic year."
      />

      {/* Class Search and Filter Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-800">Class Directory</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classes (e.g. 10, Class 5)..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
            />
          </div>
          <Link href="/teacher/admin/classes">
            <Button size="sm" className="whitespace-nowrap shadow-sm">
              Create Class
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <PageLoader />
        </div>
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          title="No classes found"
          desc={`We couldn't find any classes matching "${searchQuery}". Please refine your search.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div
              key={cls.className}
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-300 p-6 flex flex-col justify-between space-y-4"
            >
              {/* Header block with Class Name */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-zinc-800 text-base">Class {cls.className}</h3>
                  {cls.isStreamBased ? (
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider w-43">
                      Streams: {cls.streams.join(", ")}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                      Sections: {cls.sections?.join(", ") || "A"}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
                  {cls.isStreamBased 
                    ? `${cls.totalSections} ${cls.totalSections === 1 ? "Section" : "Sections"}`
                    : `${cls.sections?.length || 1} ${cls.sections?.length === 1 ? "Section" : "Sections"}`
                  }
                </span>
              </div>

              {/* Counts metrics grid with dividers */}
              <div className="border-t border-b border-zinc-100 py-3.5 space-y-2.5 text-xs text-zinc-600">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-zinc-400" />
                    <span className="font-semibold text-zinc-500">Total Students</span>
                  </div>
                  <span className="font-bold text-zinc-800">{cls.totalStudents}</span>
                </div>
                <div className="border-t border-zinc-100/50"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaUserCheck className="text-emerald-500" />
                    <span className="font-semibold text-zinc-500">New Students</span>
                  </div>
                  <span className="font-bold text-emerald-600">+{cls.newStudents}</span>
                </div>
                <div className="border-t border-zinc-100/50"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] text-zinc-400 font-extrabold">E</span>
                    <span className="font-semibold text-zinc-500">Existing Students</span>
                  </div>
                  <span className="font-bold text-zinc-700">{cls.existingStudents}</span>
                </div>
                <div className="border-t border-zinc-100/50"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaChalkboardTeacher className="text-zinc-400" />
                    <span className="font-semibold text-zinc-500">Class Teachers</span>
                  </div>
                  <span className="font-bold text-zinc-800">{cls.classTeachers}</span>
                </div>
              </div>

              {/* Direct Footer Action Link */}
              <Link href={`/admin/students/class/${cls.className}`} className="block">
                <button className="w-full py-2.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow">
                  View Students
                  <FaChevronRight className="w-2.5 h-2.5" />
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
