"use client";

import { FaEnvelope, FaPhone, FaBriefcase, FaCalendarAlt, FaUser, FaGraduationCap, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { deleteTeachersItem } from "@/features/teachers/redux/teacherThunk";

export default function TeacherProfile({ teacher = {} }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to permanently delete the teacher record of ${teacher.name}?`)) {
      dispatch(deleteTeachersItem(teacher.id)).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          router.push("/admin/teachers");
        }
      });
    }
  };

  const renderAvatar = () => {
    const hasImage = teacher.profileImage && typeof teacher.profileImage === "string" && teacher.profileImage.startsWith("http");
    if (hasImage) {
      return <img src={teacher.profileImage} alt={teacher.name} className="w-full h-full object-cover rounded-full select-none animate-fade-in" />;
    }
    return <FaUserCircle className="w-full h-full text-zinc-400" />;
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto shadow-inner overflow-hidden border border-zinc-200 shrink-0">
        {renderAvatar()}
      </div>
      <div>
        <h3 className="text-base font-bold text-zinc-800">{teacher.name}</h3>
        <p className="text-xs text-zinc-400 mt-1">{teacher.education} / {teacher.department} Department</p>
        <span className={`inline-flex items-center mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          teacher.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-500 border-zinc-200"
        }`}>
          {teacher.status}
        </span>
      </div>
      
      <div className="border-t border-zinc-100 pt-6 text-left space-y-4 text-xs text-zinc-600">
        <div className="flex items-center gap-3">
          <FaEnvelope className="text-zinc-400 w-4 h-4" />
          <span className="font-semibold w-24 text-zinc-400">Email:</span>
          <span className="text-zinc-800 font-medium">{teacher.email}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaPhone className="text-zinc-400 w-4 h-4 rotate-90" />
          <span className="font-semibold w-24 text-zinc-400">Mobile:</span>
          <span className="text-zinc-800 font-medium">{teacher.mobile}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaUser className="text-zinc-400 w-4 h-4" />
          <span className="font-semibold w-24 text-zinc-400">Gender:</span>
          <span className="text-zinc-800 font-medium">{teacher.gender}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaBriefcase className="text-zinc-400 w-4 h-4" />
          <span className="font-semibold w-24 text-zinc-400">Department:</span>
          <span className="text-zinc-800 font-medium">{teacher.department}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaGraduationCap className="text-zinc-400 w-4 h-4" />
          <span className="font-semibold w-24 text-zinc-400">Education:</span>
          <span className="text-zinc-800 font-medium">{teacher.education}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-zinc-400 w-4 h-4" />
          <span className="font-semibold w-24 text-zinc-400">Joining Date:</span>
          <span className="text-zinc-800 font-medium">{teacher.joiningDate}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaMapMarkerAlt className="text-zinc-400 w-4 h-4 text-xs" />
          <span className="font-semibold w-24 text-zinc-400">Address:</span>
          <span className="text-zinc-800 font-medium">{teacher.address || "N/A"}</span>
        </div>
      </div>

      <div className="flex gap-4 justify-center pt-4 border-t border-zinc-100">
        <button
          onClick={() => router.push(`/admin/teachers/edit/${teacher.id}`)}
          className="px-5 py-2 text-xs font-bold text-white bg-teacher-600 hover:bg-teacher-700 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          Edit Teacher
        </button>
        <button
          onClick={handleDelete}
          className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          Delete Teacher
        </button>
      </div>
    </div>
  );
}
