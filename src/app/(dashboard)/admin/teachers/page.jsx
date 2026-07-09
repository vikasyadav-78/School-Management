"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import TeacherCards from "@/features/teachers/components/TeacherCards";
import Button from "@/components/ui/Button";
import Link from "next/link";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { FaSearch } from "react-icons/fa";
import { fetchTeachersList, deleteTeachersItem } from "@/features/teachers/redux/teacherThunk";

export default function TeachersPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { list, loading } = useSelector((state) => state.teachers);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchTeachersList());
  }, [dispatch]);

  const handleView = (teacher) => {
    router.push(`/admin/teachers/profile/${teacher.id}`);
  };

  const handleEdit = (teacher) => {
    router.push(`/admin/teachers/edit/${teacher.id}`);
  };

  const handleDelete = (teacher) => {
    if (confirm(`Are you sure you want to permanently delete the teacher record of ${teacher.name}?`)) {
      dispatch(deleteTeachersItem(teacher.id));
    }
  };

  // Real-time filtering optimized with useMemo to prevent unnecessary re-renders
  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((teacher) => {
      const name = (teacher.name || "").toLowerCase();
      const email = (teacher.email || "").toLowerCase();
      const mobile = (teacher.mobile || teacher.phone || "").toLowerCase();
      const education = (teacher.education || "").toLowerCase();
      const department = (teacher.department || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        education.includes(query) ||
        department.includes(query)
      );
    });
  }, [list, searchQuery]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Teachers Directory"
        subtitle="List of all subject specialists, class teachers, and grade deans."
        action={
          <Link href="/admin/teachers/add">
            <Button size="sm" className="bg-teacher-600 hover:bg-teacher-700 shadow-md shadow-teacher-600/10 focus:ring-teacher-500 border-none">Add Teacher</Button>
          </Link>
        }
      />

      {/* Responsive Search Input Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-800">Teachers Directory</h2>
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <FaSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teachers by name, email, mobile, education..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-teacher-500/20 focus:border-teacher-500 transition-all text-zinc-800 placeholder-zinc-400 font-semibold"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <PageLoader />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <EmptyState
          title="No teachers found"
          desc={`We couldn't find any teachers matching "${searchQuery}". Please check your search term or spelling.`}
        />
      ) : (
        <TeacherCards
          teachers={filteredTeachers}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </DashboardLayout>
  );
}
