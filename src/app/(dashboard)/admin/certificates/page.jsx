"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";


import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaPlus, FaTimes, FaAward, FaDownload, FaFileAlt, FaUserGraduate, FaCheck
} from "react-icons/fa";
import { 
  getTeacherCertificatesMeta,
  getTeacherCertificates,
  addTeacherCertificate,
  downloadTeacherCertificate
} from "@/features/admin/services/admin.service";
import { toast } from "sonner";

export default function TeacherCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Creation Modal & Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState("tc"); // "tc" | "character" | "bonafide"
  const [dateOfLeaving, setDateOfLeaving] = useState("");
  const [reasonForLeaving, setReasonForLeaving] = useState("Transfer");
  const [conduct, setConduct] = useState("Good");
  const [sessionYear, setSessionYear] = useState("2025-26");

  // 1. Load Initial Data
  const loadCertificates = async () => {
    try {
      setLoading(true);
      const metaData = await getTeacherCertificatesMeta();
      setMeta(metaData.meta || metaData.data || metaData);

      const listData = await getTeacherCertificates();
      setCertificates(listData.certificates || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load certificates: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const refreshList = async () => {
    try {
      setListLoading(true);
      const listData = await getTeacherCertificates();
      setCertificates(listData.certificates || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  // Reset Form
  const resetForm = () => {
    setStudentId("");
    setType("tc");
    setDateOfLeaving("");
    setReasonForLeaving("Transfer");
    setConduct("Good");
    setSessionYear("2025-26");
    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!studentId) {
      setFormError("Student selection is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        student_id: studentId,
        type,
        date_of_leaving: dateOfLeaving || null,
        reason_for_leaving: reasonForLeaving.trim(),
        conduct: conduct.trim(),
        session: sessionYear.trim()
      };

      await addTeacherCertificate(payload);
      toast.success("Certificate generated successfully!");
      setIsFormModalOpen(false);
      refreshList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to generate certificate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (cert) => {
    try {
      toast.loading("Preparing certificate PDF download...", { id: "cert-download" });
      await downloadTeacherCertificate(cert);
      toast.success("Certificate download started!", { id: "cert-download" });
    } catch (err) {
      toast.error("Failed to download certificate: " + (err.message || err), { id: "cert-download" });
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <FaTimes className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
        <p className="text-zinc-500 font-bold leading-relaxed mt-2">
          Certificates feature is not enabled for your account. Contact school admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
      <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Certificates Generator"
          subtitle="Issue Transfer Certificates (TC), Character Certificates, and Bonafide Certificates to students."
        />
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Generate Certificate
        </button>
      </div>

      {/* Certificates Listing Table */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : certificates.length === 0 ? (
        <EmptyState 
          title="No Certificates Issued" 
          desc="Generate Transfer Certificates, Character Certificates, or Bonafide Certificates for students." 
        />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Certificate No.</th>
                  <th className="px-6 py-4 whitespace-nowrap">Student</th>
                  <th className="px-6 py-4 whitespace-nowrap">Certificate Type</th>
                  <th className="px-6 py-4 whitespace-nowrap">Issue Date</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-zinc-700">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-500">
                      {cert.certificate_number || `CERT-00${cert.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-xs">
                          {(cert.student_name || cert.student?.full_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-zinc-800 block">
                            {cert.student_name || cert.student?.full_name || "Student"}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            Session: {cert.session || "2025-26"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${
                        cert.type === "tc" ? "bg-amber-50 border-amber-100 text-amber-600" :
                        cert.type === "character" ? "bg-blue-50 border-blue-100 text-blue-600" :
                        "bg-emerald-50 border-emerald-100 text-emerald-600"
                      }`}>
                        {cert.type === "tc" ? "Transfer Certificate (TC)" : cert.type === "character" ? "Character Certificate" : "Bonafide Certificate"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-zinc-600">
                      {cert.issue_date || cert.created_at_label || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDownload(cert)}
                        className="px-3 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 mx-auto text-[11px] cursor-pointer"
                      >
                        <FaDownload className="w-3 h-3" /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Certificate Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaAward className="text-violet-500" />
                Generate Student Certificate
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Student</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="">Choose Student</option>
                  {(meta?.students || []).map(st => {
                    const code = st.student_code || st.admission_no || st.admission_number || st.roll_no || st.roll_number || st.code;
                    const name = st.full_name || st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim() || "Student";
                    return (
                      <option key={st.id} value={st.id}>
                        {name}{code ? ` (${code})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Certificate Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700"
                >
                  <option value="tc">Transfer Certificate (TC)</option>
                  <option value="character">Character Certificate</option>
                  <option value="bonafide">Bonafide Certificate</option>
                </select>
              </div>

              {type === "tc" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Date of Leaving</label>
                  <input
                    type="date"
                    value={dateOfLeaving}
                    onChange={(e) => setDateOfLeaving(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Reason for Leaving / Remarks</label>
                <input 
                  type="text"
                  value={reasonForLeaving}
                  onChange={(e) => setReasonForLeaving(e.target.value)}
                  placeholder="e.g. Parent Transfer"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Conduct</label>
                  <input 
                    type="text"
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    placeholder="e.g. Good"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Session Year</label>
                  <input 
                    type="text"
                    value={sessionYear}
                    onChange={(e) => setSessionYear(e.target.value)}
                    placeholder="e.g. 2025-26"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold text-xs"
                >
                  {submitting ? "Generating..." : "Generate Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
    );
}
