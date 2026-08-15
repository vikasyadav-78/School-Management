"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import {
  FaArrowLeft, FaVideo, FaUsers, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle, FaUser
} from "react-icons/fa";
import { getAdminLiveClassReportDetail } from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function AdminLiveClassReportDetailPage() {
  const router = useRouter();
  const { liveClassId } = useParams();

  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await getAdminLiveClassReportDetail(liveClassId);
      setDetailData(data);
    } catch (err) {
      toast.error("Failed to load attendance report: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (liveClassId) {
      fetchDetail();
    }
  }, [liveClassId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (!detailData || !detailData.live_class) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 space-y-4">
          <p className="text-zinc-500 font-bold">Live class report not found.</p>
          <Button
            onClick={() => router.push("/admin/live-classes/reports")}
            variant="primary"
            size="sm"
            className="inline-flex items-center gap-1.5"
          >
            <FaArrowLeft className="w-3.5 h-3.5" /> Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const liveClass = detailData.live_class;
  const joinStats = detailData.join_stats || { total_students: 0, joined: 0, not_joined: 0 };
  const attendanceList = detailData.attendance || [];
  
  const attendanceRate = joinStats.total_students > 0 ? Math.round((joinStats.joined / joinStats.total_students) * 100) : 0;
  
  // Pagination slicing
  const currentRecords = attendanceList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <PageHeader
          title="Attendance Report"
          subtitle="Detailed view of student attendance and participation stats."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/live-classes/reports")}
              className="inline-flex items-center gap-1.5"
            >
              <FaArrowLeft className="w-3.5 h-3.5" /> Back to Reports
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Information Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                    <FaVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800">{liveClass.subject || "—"}</h4>
                    <span className="text-[10px] text-zinc-400 block font-medium">
                      {liveClass.title || "—"} • {liveClass.class || "—"}{liveClass.section ? ` (${liveClass.section})` : ""}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                  liveClass.status === "completed" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  liveClass.status === "cancelled" ? "bg-rose-50 border-rose-100 text-rose-600" :
                  "bg-violet-50 border-violet-100 text-violet-600"
                }`}>{liveClass.status_label || liveClass.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Topic</span>
                  <span className="font-extrabold text-zinc-800">{liveClass.topic || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Platform</span>
                  <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                    <FaVideo className="text-zinc-400" />
                    {liveClass.platform_label || liveClass.platform || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Scheduled At</span>
                  <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                    <FaClock className="text-zinc-400" />
                    {liveClass.scheduled_at_label || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Duration</span>
                  <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                    <FaClock className="text-zinc-400" />
                    {liveClass.duration_minutes || 0} Minutes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Join Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <FaUsers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-800">Join Summary</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Overall attendance stats</p>
                </div>
              </div>

              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-black text-zinc-800">{attendanceRate}%</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Attendance Rate</span>
              </div>

              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mb-6">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100/50">
                  <span className="flex items-center gap-2 text-zinc-600 font-bold">
                    <FaCheckCircle className="text-emerald-500 w-4 h-4" /> Joined
                  </span>
                  <span className="text-sm font-black text-zinc-800">{joinStats.joined}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100/50">
                  <span className="flex items-center gap-2 text-zinc-600 font-bold">
                    <FaTimesCircle className="text-rose-500 w-4 h-4" /> Not Joined
                  </span>
                  <span className="text-sm font-black text-zinc-800">{joinStats.not_joined}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-100 pt-4 mt-6">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Enrolled</span>
              <span className="text-base font-black text-zinc-800">{joinStats.total_students}</span>
            </div>
          </div>
        </div>

        {/* Student Attendance Roster Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-zinc-800 text-sm">Student Attendance Roster</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">List of students enrolled in this class</p>
            </div>
            <span className="px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {attendanceList.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/75 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Student Info</th>
                  <th className="px-6 py-3">Roll No</th>
                  <th className="px-6 py-3">Admission No</th>
                  <th className="px-6 py-3 text-center">Joined</th>
                  <th className="px-6 py-3 text-center">Attendance Status</th>
                  <th className="px-6 py-3">Join Time</th>
                  <th className="px-6 py-3">Leave Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700 font-semibold">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-zinc-400 italic">No student roster found or attendance records loaded.</td>
                  </tr>
                ) : (
                  currentRecords.map((record) => {
                    const student = record.student || {};
                    const isJoined = record.joined;
                    const attn = record.attendance || {};

                    return (
                      <tr key={student.id} className="hover:bg-zinc-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {student.photo ? (
                              <img src={student.photo} alt={student.full_name || "Student"} className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-xs">{(student.full_name || "S").charAt(0).toUpperCase()}</div>
                            )}
                            <div>
                              <span className="font-bold text-zinc-800 block">{student.full_name || "Unknown"}</span>
                              <span className="text-[9px] text-zinc-400 block uppercase tracking-wider font-extrabold">{student.student_id || "STU-NEW"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600 font-bold">{student.roll_no || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600">{student.admission_no || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                            isJoined ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                          }`}>{isJoined ? "Yes" : "No"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isJoined ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                              attn.status?.toLowerCase() === "present" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                              attn.status?.toLowerCase() === "late" ? "bg-amber-50 border-amber-100 text-amber-600" :
                              attn.status?.toLowerCase() === "early_exit" ? "bg-purple-50 border-purple-100 text-purple-600" :
                              "bg-zinc-50 border-zinc-200 text-zinc-500"
                            }`}>{attn.status_label || attn.status || "Joined"}</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-lg border border-rose-100 bg-rose-50 text-[8px] font-black text-rose-600 uppercase tracking-wider">Absent</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600 font-bold">{attn.joined_at_label || attn.joined_at || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600">{attn.left_at_label || attn.left_at || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {attendanceList.length > pageSize && (
            <div className="px-6 py-4 border-t border-zinc-100 bg-white">
              <Pagination
                currentPage={currentPage}
                totalCount={attendanceList.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
