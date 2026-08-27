"use client";

import { 
  FaEnvelope, FaPhone, FaBriefcase, FaCalendarAlt, FaUser, FaGraduationCap, 
  FaMapMarkerAlt, FaFileAlt, FaQrcode, FaPrint, FaIdCard, FaSignInAlt, FaEdit, FaArrowLeft, FaDownload
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { impersonateTeacherUser } from "@/features/auth/redux/moduleThunk";
import { toast } from "sonner";
import { api } from "@/services/api";

export default function TeacherProfile({ teacher = {} }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleImpersonate = async () => {
    try {
      const resultAction = await dispatch(impersonateTeacherUser(teacher.id));
      if (impersonateTeacherUser.fulfilled.match(resultAction)) {
        toast.success("Logged in as teacher successfully!");
        window.location.href = "/teacher/dashboard";
      } else {
        toast.error(resultAction.payload || "Failed to login as teacher.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to impersonate teacher.");
    }
  };

  const handleDownloadQR = () => {
    const qrSrc = teacher.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${teacher.employee_id || teacher.id}`;
    const link = document.createElement("a");
    link.href = qrSrc;
    link.download = `teacher-qr-${teacher.employee_id || teacher.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  const handleOpenIDCard = async () => {
    try {
      toast.info("Loading teacher ID card...");
      
      let htmlContent = "";
      try {
        const response = await api.get(`/admin/teachers/${teacher.id}/id-card?theme=classic`);
        htmlContent = response.data;
      } catch (e) {
        // Fallback to staff ID card API
        const response = await api.get(`/admin/staff/${teacher.id}/id-card?theme=classic`);
        htmlContent = response.data;
      }
      
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.focus();
        toast.success("ID Card loaded successfully!");
      } else {
        toast.focus ? toast.error("Popup blocker prevented opening the ID card.") : null;
      }
    } catch (err) {
      console.warn("API fetch failed, falling back to cookie session view", err);
      const apiBase = process.env.NEXT_PUBLIC_BASE_URL || "";
      const baseUrl = apiBase.replace(/\/api$/, "");
      window.open(`${baseUrl}/school-admin/teachers/${teacher.id}/id-card?theme=classic`, '_blank');
    }
  };

  const renderAvatar = () => {
    const photoUrl = teacher.photo || teacher.profileImage;
    if (photoUrl) {
      return <img src={photoUrl} alt={teacher.name || teacher.full_name} className="w-full h-full object-cover rounded-full select-none" />;
    }
    return (
      <div className="w-full h-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-3xl">
        {(teacher.full_name || teacher.name || "T").charAt(0).toUpperCase()}
      </div>
    );
  };

  const isActive = teacher.is_active || teacher.status === "Active";

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left text-zinc-600">
      
      {/* Top Actions Row */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => router.push(`/admin/teachers`)}
          className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaArrowLeft className="w-3 h-3" /> Back to List
        </button>
        <button
          onClick={() => router.push(`/admin/teachers?edit=${teacher.id}`)}
          className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaEdit className="w-3.5 h-3.5" /> Edit Teacher
        </button>
        <button
          onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
          className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          Feature Access
        </button>
        <button
          onClick={handleOpenIDCard}
          className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaPrint className="w-3.5 h-3.5" /> ID Card / Print
        </button>
        <button
          onClick={handleImpersonate}
          className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaSignInAlt className="w-3.5 h-3.5" /> Login as Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Detailed Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-200 shadow-inner shrink-0">
              {renderAvatar()}
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h3 className="text-base font-extrabold text-zinc-800 leading-normal">{teacher.full_name || teacher.name}</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Employee ID: {teacher.employee_id || "—"}</p>
              <p className="text-xs text-zinc-500 font-medium">Login: {teacher.email}</p>
              <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${
                isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
              }`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Documents</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">Aadhaar Card</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{teacher.aadhaar_card ? "Uploaded" : "Not uploaded"}</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit / upload</span>
              </div>
              <div className="border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">PAN Card</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{teacher.pan_card ? "Uploaded" : "Not uploaded"}</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit / upload</span>
              </div>
              <div className="border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between col-span-1 sm:col-span-2">
                <div>
                  <span className="font-bold text-zinc-800 block">Qualification Certificate</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{teacher.qualification_certificate ? "Uploaded" : "Not uploaded"}</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit / upload</span>
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Professional Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Qualification</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.qualification || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Specialization</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.specialization || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Total experience</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.experience || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Joining Date</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.joiningDate || teacher.joining_date || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Salary</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.salary || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Phone</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.phone || teacher.mobile || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Gender</span>
                <span className="text-zinc-700 font-extrabold text-[13px] capitalize">{teacher.gender || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Date of Birth</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.date_of_birth || teacher.dob || "—"}</span>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Address</h4>
            <p className="text-zinc-700 font-extrabold text-sm">{teacher.address || "Not set"}</p>
          </div>

          {/* Bank Details Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Bank Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Account Holder</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.account_holder_name || teacher.bank_details?.account_holder || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Bank Name</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.bank_name || teacher.bank_details?.bank_name || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Account Number</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.account_number || teacher.bank_details?.account_number || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">IFSC Code</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.ifsc_code || teacher.bank_details?.ifsc_code || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Account Type</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.account_type || teacher.bank_details?.account_type || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">PAN Number</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{teacher.pan_number || teacher.bank_details?.pan_number || "—"}</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 italic mt-2">
              <span 
                onClick={() => router.push(`/admin/teachers?edit=${teacher.id}`)}
                className="text-violet-600 hover:text-violet-850 hover:underline cursor-pointer font-bold"
              >
                Edit profile
              </span>{" "}
              to add bank details for salary.
            </p>
          </div>

        </div>

        {/* Right Sidebar Column: QR Code & ID Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-center space-y-4">
            <h4 className="text-sm font-bold text-zinc-800 tracking-tight">Quick QR</h4>
            <div className="space-y-2">
              <div className="w-36 h-36 bg-white border border-zinc-150 rounded-xl flex items-center justify-center mx-auto shadow-sm overflow-hidden p-2 select-none">
                <img 
                  src={teacher.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${teacher.employee_id || teacher.id}`} 
                  alt="Quick QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                {teacher.employee_id || "—"}
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadQR}
                className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-extrabold rounded-xl py-2 text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <FaDownload className="w-3 h-3 text-zinc-500" /> Download QR
              </button>
              <button
                onClick={handleOpenIDCard}
                className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl py-2.5 text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <FaIdCard className="w-3.5 h-3.5" /> Open Full ID Card
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
