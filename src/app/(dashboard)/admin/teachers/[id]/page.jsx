"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageLoader from "@/components/common/PageLoader";
import { 
  FaArrowLeft, FaFolder, FaTimes, FaCheck 
} from "react-icons/fa";
import { 
  getTeacherFeatures, 
  updateTeacherFeatures 
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";

const getFeatureDesc = (feature) => {
  if (feature.builtin) {
    return "Teacher panel always on - check here to grant Admin control";
  }
  if ([
    "students", "teachers", "staff", "payroll", "classes", 
    "subjects", "academic_years", "fees", "certificates", 
    "reports", "ai_insights"
  ].includes(feature.key)) {
    return "Admin control only";
  }
  if (feature.key === "microsoft_meet") {
    return "";
  }
  return "Teacher panel + Admin control";
};

export default function TeacherFeaturesAccessPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [teacher, setTeacher] = useState(null);
  const [delegableFeatures, setDelegableFeatures] = useState([]);
  const [assignedFeatures, setAssignedFeatures] = useState([]);
  const [defaultFeatures, setDefaultFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFeaturesData = async () => {
      try {
        setLoading(true);
        const res = await getTeacherFeatures(id);
        
        setTeacher(res.teacher || { id, full_name: "Teacher", employee_id: "" });
        setDelegableFeatures(res.delegable_features || []);
        setAssignedFeatures(res.assigned_features || []);
        setDefaultFeatures(res.default_features || ["timetable", "homework", "class_notes", "leave", "notices", "holidays"]);
      } catch (err) {
        toast.error("Failed to load delegated features: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFeaturesData();
    }
  }, [id]);

  const handleSelectAll = () => {
    setAssignedFeatures(delegableFeatures.map(f => f.key));
  };

  const handleClearAll = () => {
    setAssignedFeatures([]);
  };

  const handleSetDefaults = () => {
    setAssignedFeatures(defaultFeatures);
  };

  const handleSaveAccess = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateTeacherFeatures(id, { features: assignedFeatures });
      toast.success("Delegated features access updated successfully!");
      router.push(`/admin/teachers/profile/${id}`);
    } catch (err) {
      toast.error("Failed to update features: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-left animate-fade-in font-semibold text-zinc-600">
        
        {/* Top Back Nav */}
        <button 
          onClick={() => router.push(`/admin/teachers/profile/${id}`)}
          className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider bg-transparent border-none cursor-pointer"
        >
          &lt; BACK TO TEACHER
        </button>

        {/* Top Banner */}
        <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm flex flex-col gap-3">
          <h2 className="font-black text-zinc-800 text-2xl leading-none uppercase">{teacher?.full_name || teacher?.name}</h2>
          <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
            Employee ID: <span className="text-zinc-600 font-black">{teacher?.employee_id || "—"}</span> - SELECT WHICH MODULES THIS TEACHER CAN USE.
          </p>
          <div className="text-[11px] text-zinc-500 font-bold leading-relaxed max-w-4xl bg-zinc-50 border border-zinc-100 p-4 rounded-2xl">
            Timetable, Homework, Class Notes, Leave, Notices, and Holidays are always available in the teacher panel. Check modules below only when you want to grant extra access (e.g. Attendance, Exams) or <span className="text-violet-600 font-extrabold">Admin control</span>.
          </div>
        </div>

        {/* Action Helper Row */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSelectAll} 
            className="px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-extrabold rounded-2xl shadow-sm transition-all cursor-pointer text-xs"
          >
            Select All
          </button>
          <button 
            onClick={handleClearAll} 
            className="px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-extrabold rounded-2xl shadow-sm transition-all cursor-pointer text-xs"
          >
            Clear All
          </button>
          <button 
            onClick={handleSetDefaults} 
            className="px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-extrabold rounded-2xl shadow-sm transition-all cursor-pointer text-xs"
          >
            Default Teacher Modules
          </button>
        </div>

        {/* Grid Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {delegableFeatures.map((feature) => {
            const isChecked = assignedFeatures.includes(feature.key);
            const desc = getFeatureDesc(feature);
            return (
              <label 
                key={feature.key} 
                className={`flex items-start gap-4 p-6 bg-white border rounded-[1rem] shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${
                  isChecked ? "border-violet-600 ring-[3px] ring-violet-100/50" : "border-zinc-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAssignedFeatures((prev) => [...prev, feature.key]);
                    } else {
                      setAssignedFeatures((prev) => prev.filter((k) => k !== feature.key));
                    }
                  }}
                  className="mt-1 w-4 h-4 accent-violet-600 rounded cursor-pointer shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-zinc-800 leading-none">{feature.label}</span>
                    {feature.builtin && (
                      <span className="text-[8px] bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-block">
                        TEACHER PANEL ALWAYS ON
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p className="text-[10px] text-zinc-400 font-bold leading-normal">{desc}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
          <button 
            onClick={handleSaveAccess} 
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-colors shadow-sm cursor-pointer"
          >
            {saving ? "Saving Changes..." : "Save Access"}
          </button>
          <button 
            onClick={() => router.push(`/admin/teachers/profile/${id}`)} 
            className="px-6 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-2xl text-xs shadow-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Current Info Panel */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Currently active for this teacher:</span>
          <p className="text-xs font-bold text-zinc-700">
            {assignedFeatures.length === 0 ? "None" : (
              delegableFeatures.filter(f => assignedFeatures.includes(f.key)).map(f => f.label).join(", ")
            )}
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
