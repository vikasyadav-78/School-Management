"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeacherProfile } from "@/features/teachers/redux/teacherThunk";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaArrowLeft, FaVideo, FaUsers, FaCheckCircle, 
  FaTimesCircle, FaClock, FaExclamationTriangle, FaUser, FaTimes 
} from "react-icons/fa";
import { getTeacherLiveClassReportDetail } from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherLiveClassReportDetailPage() {
  const router = useRouter();
  const { liveClassId } = useParams();
  const dispatch = useDispatch();

  const { profile } = useSelector((state) => state.teachers);

  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      if (!profile) {
        await dispatch(fetchTeacherProfile()).unwrap();
      }
      const data = await getTeacherLiveClassReportDetail(liveClassId);
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
      <div className="text-center py-20 space-y-4">
        <p className="text-zinc-500 font-bold">Live class report not found.</p>
        <button
          onClick={() => router.push("/teacher/live-classes/reports")}
          className="px-4 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <FaArrowLeft className="w-3.5 h-3.5" /> Back to Reports
        </button>
      </div>
    );
  }

  const liveClass = detailData.live_class;
  const joinStats = detailData.join_stats || { total_students: 0, joined: 0, not_joined: 0 };
  const attendanceList = detailData.attendance || [];

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/teacher/live-classes/reports")}
          className="p-2 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200 text-zinc-600 bg-white cursor-pointer"
          title="Back to Reports list"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
        </button>
        <PageHeader 
          title="Live Class Attendance Report"
          subtitle="Detailed statistics of student join times, leave times, and attendance status."
        />
      </div>

      {/* Class Information & Join Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Metadata */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2">
            <FaVideo className="text-violet-500" /> Class Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-zinc-600">
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Title:</span>
              <span className="font-extrabold text-zinc-800">{liveClass.title || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Topic:</span>
              <span className="font-extrabold text-zinc-800">{liveClass.topic || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Subject:</span>
              <span className="font-extrabold text-zinc-800 capitalize">{liveClass.subject || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Class / Section:</span>
              <span className="font-extrabold text-zinc-800">{liveClass.class || "—"}{liveClass.section ? ` (${liveClass.section})` : ""}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Platform:</span>
              <span className="font-extrabold text-zinc-800">{liveClass.platform_label || liveClass.platform || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Scheduled At:</span>
              <span className="font-extrabold text-zinc-800">{liveClass.scheduled_at_label || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Duration:</span>
              <span className="font-extrabold text-zinc-800">{liveClass.duration_minutes || 0} Minutes</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span>Status:</span>
              <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                liveClass.status === "completed" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                liveClass.status === "cancelled" ? "bg-rose-50 border-rose-100 text-rose-600" :
                "bg-violet-50 border-violet-100 text-violet-600"
              }`}>
                {liveClass.status_label || liveClass.status}
              </span>
            </div>
          </div>
        </div>

        {/* Join Summary Stats */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 mb-4">
              <FaUsers className="text-blue-500" /> Join Summary
            </h3>
            <div className="space-y-3 font-semibold text-zinc-600">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <span>Joined Students:</span>
                <span className="text-base font-extrabold text-emerald-600">{joinStats.joined}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <span>Not Joined Students:</span>
                <span className="text-base font-extrabold text-rose-600">{joinStats.not_joined}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span>Total Students:</span>
                <span className="text-base font-extrabold text-zinc-800">{joinStats.total_students}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-zinc-800 text-sm">Student Attendance Roster</h3>
          <span className="px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Total {attendanceList.length} Roster Students
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
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-zinc-400 italic">
                    No student roster found or attendance records loaded.
                  </td>
                </tr>
              ) : (
                attendanceList.map((record) => {
                  const student = record.student || {};
                  const isJoined = record.joined;
                  const attn = record.attendance || {};

                  return (
                    <tr key={student.id} className="hover:bg-zinc-50/30 transition-colors">
                      {/* Student Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {student.photo ? (
                            <img
                              src={student.photo}
                              alt={student.full_name || "Student"}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs">
                              {(student.full_name || "S").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-zinc-800 block">
                              {student.full_name || "Unknown"}
                            </span>
                            <span className="text-[9px] text-zinc-400 block uppercase tracking-wider font-extrabold">
                              {student.student_id || "STU-NEW"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-600 font-bold">
                        {student.roll_no || "—"}
                      </td>

                      {/* Admission Number */}
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-600">
                        {student.admission_no || "—"}
                      </td>

                      {/* Joined Checkmark */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                          isJoined 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                            : "bg-rose-50 border-rose-100 text-rose-600"
                        }`}>
                          {isJoined ? "Yes" : "No"}
                        </span>
                      </td>

                      {/* Attendance Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isJoined ? (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                            attn.status?.toLowerCase() === "present" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            attn.status?.toLowerCase() === "late" ? "bg-amber-50 border-amber-100 text-amber-600" :
                            attn.status?.toLowerCase() === "early_exit" ? "bg-purple-50 border-purple-100 text-purple-600" :
                            "bg-zinc-50 border-zinc-200 text-zinc-500"
                          }`}>
                            {attn.status_label || attn.status || "Joined"}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-lg border border-rose-100 bg-rose-50 text-[8px] font-black text-rose-600 uppercase tracking-wider">
                            Absent
                          </span>
                        )}
                      </td>

                      {/* Join Time */}
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-600 font-bold">
                        {attn.joined_at_label || attn.joined_at || "—"}
                      </td>

                      {/* Leave Time */}
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-600">
                        {attn.left_at_label || attn.left_at || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
