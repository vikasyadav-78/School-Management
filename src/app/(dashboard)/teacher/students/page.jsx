"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { FaSearch } from "react-icons/fa";
import { fetchTeacherAttendanceClasses } from "@/features/teachers/redux/teacherThunk";
import { fetchStudentsByClass } from "@/features/students/redux/studentThunk";

export default function MyStudentsPage() {
  const dispatch = useDispatch();
  
  const { classes, loading: classesLoading } = useSelector((state) => state.teachers);
  const studentsList = useSelector((state) => state.students.list) || [];
  const studentsLoading = useSelector((state) => state.students.loading);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch classes on mount
  useEffect(() => {
    dispatch(fetchTeacherAttendanceClasses());
  }, [dispatch]);

  // 2. Set default class when classes load
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id.toString());
    }
  }, [classes, selectedClassId]);

  const activeClass = classes.find(c => c.id.toString() === selectedClassId);
  const activeSection = activeClass?.sections?.[0]?.name || activeClass?.sections?.[0] || "A";

  // 3. Fetch students when selected class changes
  useEffect(() => {
    if (activeClass) {
      const className = activeClass.name || activeClass.class_name;
      dispatch(fetchStudentsByClass(className));
    }
  }, [dispatch, selectedClassId, activeClass]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return studentsList;

    return studentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        (s.parentName && s.parentName.toLowerCase().includes(query))
    );
  }, [studentsList, searchQuery]);

  if (classesLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={activeClass ? `Class ${(activeClass.name || activeClass.class_name)}-${activeSection} Students` : "Class Students"}
        subtitle={`Roster list of all students currently enrolled in your class section.`}
      />

      {classes && classes.length > 1 && (
        <div className="flex gap-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id.toString())}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedClassId === cls.id.toString()
                  ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {cls.name || cls.class_name}
            </button>
          ))}
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-zinc-800">Class Section Statistics</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Total Students: <span className="font-bold text-zinc-700">{studentsList.length}</span> | 
            Active: <span className="font-bold text-emerald-600">{studentsList.filter(s => s.status === "Active" || !s.status).length}</span> | 
            Inactive: <span className="font-bold text-zinc-400">{studentsList.filter(s => s.status === "Inactive").length}</span>
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <FaSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
          />
        </div>
      </div>

      {studentsLoading ? (
        <div className="flex items-center justify-center py-20">
          <PageLoader />
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          desc="No student matching your criteria could be found in this class."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-150 text-left border-collapse">
              <thead className="bg-zinc-50/50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Roll No
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    DOB
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Parent Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Contact Phone
                  </th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-700 whitespace-nowrap">
                      {s.id}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {s.rollNo || s.id.replace(/[^0-9]/g, "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/10 text-violet-600 flex items-center justify-center font-extrabold border border-violet-500/20">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-zinc-800 block">{s.name}</span>
                          <span className="text-[10px] text-zinc-400 font-medium">{s.email || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 whitespace-nowrap capitalize">
                      {s.gender || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                      {s.dob || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                      {s.parentName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                      {s.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
                        s.status !== "Inactive"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-zinc-50 text-zinc-400 border-zinc-200"
                      }`}>
                        {s.status || "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
