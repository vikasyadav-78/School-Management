"use client";

import { 
  FaEnvelope, FaPhone, FaBriefcase, FaCalendarAlt, FaUser, 
  FaMapMarkerAlt, FaFileAlt, FaQrcode, FaPrint, FaIdCard, FaEdit, FaArrowLeft, FaDownload
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/services/api";

export default function StaffProfile({ staff = {} }) {
  const router = useRouter();

  const handleDownloadQR = () => {
    const qrSrc = staff.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${staff.employee_id || staff.id}`;
    const link = document.createElement("a");
    link.href = qrSrc;
    link.download = `staff-qr-${staff.employee_id || staff.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  const handleOpenIDCard = async () => {
    const rawUrl = staff.id_card_url || `/admin/staff/${staff.id}/id-card?format=print`;
    try {
      toast.loading("Loading official ID Card...", { id: "load-id-card" });
      
      let requestPath = rawUrl;
      if (rawUrl.includes("://")) {
        const urlObj = new URL(rawUrl);
        requestPath = urlObj.pathname + urlObj.search;
      }
      
      // Strip leading "/api" or "api" because Axios instance already prefixes it
      requestPath = requestPath.replace(/^\/?api\//, "/");
      
      const response = await api.get(requestPath, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "text/html" });
      const blobUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, "_blank");
      if (newTab) {
        newTab.focus();
      } else {
        toast.error("Popup blocked! Please allow popups for this site.");
      }
      toast.dismiss("load-id-card");
    } catch (err) {
      toast.error("Failed to load ID Card: " + (err.message || err), { id: "load-id-card" });
    }
  };

  const renderAvatar = () => {
    if (staff.photo) {
      return <img src={staff.photo} alt={staff.full_name || staff.name} className="w-full h-full object-cover rounded-full select-none" />;
    }
    return (
      <div className="w-full h-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-3xl">
        {(staff.full_name || staff.name || "S").charAt(0).toUpperCase()}
      </div>
    );
  };

  const isActive = staff.is_active || staff.status === "Active" || staff.status === 1;

  // Resolve bank object fields
  const bank = staff.bank || {};

  // Resolve documents object fields
  const documents = staff.documents || {};

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left text-zinc-600">
      
      {/* Top Actions Row */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => router.push(`/admin/staff`)}
          className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaArrowLeft className="w-3 h-3" /> Back to List
        </button>
        <button
          onClick={() => router.push(`/admin/staff?edit=${staff.id}`)}
          className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaEdit className="w-3.5 h-3.5" /> Edit Staff Details
        </button>
        <button
          onClick={handleOpenIDCard}
          className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <FaPrint className="w-3.5 h-3.5" /> ID Card / Print
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
              <h3 className="text-base font-extrabold text-zinc-800 leading-normal">{staff.full_name || staff.name}</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Employee ID: {staff.employee_id || "—"}</p>
              <p className="text-xs text-zinc-500 font-medium">Designation: {staff.designation || "—"} | Department: {staff.department || "—"}</p>
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
              
              {/* Aadhaar */}
              <div className="border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">Aadhaar Card</span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {documents.aadhaar ? `Uploaded (${documents.aadhaar.file_name || "mahakal.png"})` : "Not uploaded"}
                  </span>
                </div>
                {documents.aadhaar?.url && (
                  <a 
                    href={documents.aadhaar.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View / Download
                  </a>
                )}
              </div>

              {/* PAN */}
              <div className="border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">PAN Card</span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {documents.pan ? `Uploaded (${documents.pan.file_name})` : "Not uploaded"}
                  </span>
                </div>
                {documents.pan?.url && (
                  <a 
                    href={documents.pan.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    View / Download
                  </a>
                )}
              </div>

              {/* ID Proof */}
              <div className="border border-zinc-100 rounded-xl p-3.5 flex items-center justify-between col-span-1 sm:col-span-2">
                <div>
                  <span className="font-bold text-zinc-800 block">ID Proof</span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {documents.id_proof ? `Uploaded (${documents.id_proof.file_name})` : "Not uploaded"}
                  </span>
                </div>
                {documents.id_proof?.url && (
                  <a 
                    href={documents.id_proof.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    View / Download
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Employment & Contact Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Designation</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{staff.designation || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Department</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{staff.department || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Joining Date</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{staff.joining_date_label || staff.joining_date || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Salary</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">
                  {staff.salary !== undefined ? `${staff.salary}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Phone</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{staff.phone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Gender</span>
                <span className="text-zinc-700 font-extrabold text-[13px] capitalize">{staff.gender || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Date of Birth</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{staff.date_of_birth_label || staff.date_of_birth || "—"}</span>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Address</h4>
            <p className="text-zinc-700 font-extrabold text-sm">{staff.address || "Not set"}</p>
          </div>

          {/* Bank Details Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block border-b border-zinc-100 pb-2">Bank Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Account Holder</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{bank.account_holder_name || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Bank Name</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{bank.bank_name || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Account Number</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{bank.account_number || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">IFSC Code</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{bank.ifsc_code || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Account Type</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{bank.account_type || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">PAN Number</span>
                <span className="text-zinc-700 font-extrabold text-[13px]">{bank.pan_number || "—"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column: QR Code & ID Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm text-center space-y-4">
            <h4 className="text-sm font-bold text-zinc-800 tracking-tight">Quick QR</h4>
            <div className="space-y-2">
              <div className="w-36 h-36 bg-white border border-zinc-150 rounded-xl flex items-center justify-center mx-auto shadow-sm overflow-hidden p-2 select-none">
                <img 
                  src={staff.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${staff.employee_id || staff.id}`} 
                  alt="Quick QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                {staff.employee_id || "—"}
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
