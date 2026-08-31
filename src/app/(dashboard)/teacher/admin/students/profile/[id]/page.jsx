"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import { 
  FaUserCheck, FaArrowLeft, FaIdCard, FaUser, FaPhone, FaCalendarAlt, FaEnvelope, FaMapMarkerAlt,
  FaFileAlt, FaCheckCircle, FaTimesCircle, FaDownload, FaQrcode
} from "react-icons/fa";
import { 
  getTeacherStudentDetail,
  getTeacherStudentIdCard
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function TeacherStudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const dialog = useAppDialog();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  
  // ID Card Modal
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [idCardData, setIdCardData] = useState(null);
  const [idCardLoading, setIdCardLoading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await getTeacherStudentDetail(id);
        if (response.success) {
          setStudent(response.student);
        } else {
          toast.error(response.message || "Failed to load student details");
          router.push("/teacher/admin/students");
        }
      } catch (error) {
        if (error?.status === 403 || error?.message?.includes("403")) {
          setForbidden(true);
        } else {
          toast.error(error.message || "Failed to load student details");
          router.push("/teacher/admin/students");
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handleOpenIdCard = async () => {
    setIdCardModalOpen(true);
    setIdCardLoading(true);
    setIdCardData(null);
    try {
      const response = await getTeacherStudentIdCard(id);
      if (response.success) {
        setIdCardData(response);
      } else {
        toast.error(response.message || "Failed to load ID card");
        setIdCardModalOpen(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load ID card");
      setIdCardModalOpen(false);
    } finally {
      setIdCardLoading(false);
    }
  };

  const handlePrintIdCard = (themeUrl) => {
    if (themeUrl) {
      window.open(themeUrl, '_blank');
    }
  };

  const openDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error("Document not found");
    }
  };

  if (loading) return <PageLoader />;

  if (forbidden) {
    return (
      <div className="p-8 text-center animate-fade-in max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 max-w-md mx-auto">
          <FaUserCheck className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-600 mt-2 text-sm">
            You do not have permission to manage students. Please contact the school administrator if you believe this is an error.
          </p>
          <Button 
            onClick={() => router.back()}
            className="mt-6 bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      <PageHeader 
        title={`${student.full_name || student.first_name}'s Profile`}
        subtitle="Complete student information and records"
        action={
          <Button 
            variant="secondary"
            onClick={() => router.push('/teacher/admin/students')}
            className="flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back to Students
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card & Quick Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Overview Card */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="relative pt-8 flex flex-col items-center">
              {student.photo ? (
                <img 
                  src={student.photo} 
                  alt={student.full_name} 
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg bg-white" 
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-4xl border-4 border-white shadow-lg">
                  {student.first_name?.charAt(0) || student.full_name?.charAt(0) || "U"}
                </div>
              )}
              
              <h2 className="mt-4 text-xl font-bold text-zinc-900 text-center">
                {student.full_name || `${student.first_name} ${student.last_name || ''}`.trim()}
              </h2>
              <div className="text-sm font-medium text-indigo-600 mt-1">
                Class {student.class || "—"} • Section {student.section || "—"}{student.stream ? ` • Stream ${student.stream}` : ""}
              </div>
              
              <div className="flex gap-2 mt-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                  student.is_active 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {student.is_active ? <FaCheckCircle className="mr-1.5" /> : <FaTimesCircle className="mr-1.5" />}
                  {student.is_active ? "Active Student" : "Inactive Student"}
                </span>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-zinc-100">
                <div className="text-center">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Admission No</div>
                  <div className="font-mono text-sm font-bold text-zinc-800 bg-zinc-50 py-1.5 rounded-lg border border-zinc-100">
                    {student.admission_no || "—"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Roll Number</div>
                  <div className="font-mono text-sm font-bold text-zinc-800 bg-zinc-50 py-1.5 rounded-lg border border-zinc-100">
                    {student.roll_no || "—"}
                  </div>
                </div>
                <div className="text-center col-span-2">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Student ID</div>
                  <div className="font-mono text-sm font-bold text-zinc-800 bg-zinc-50 py-1.5 rounded-lg border border-zinc-100">
                    {student.student_id || "—"}
                  </div>
                </div>
              </div>

              <div className="w-full mt-6 flex gap-3">
                <Button 
                  onClick={() => router.push(`/teacher/admin/students/edit/${student.id}`)}
                  className="flex-1 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold"
                >
                  Edit Profile
                </Button>
                <Button 
                  onClick={handleOpenIdCard}
                  className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold"
                >
                  <FaIdCard className="mr-2" /> ID Card
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <FaPhone className="text-indigo-500" /> Contact Details
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Guardian Phone</div>
                <div className="text-sm font-semibold text-zinc-800">{student.guardian_phone || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Email Address</div>
                <div className="text-sm font-semibold text-zinc-800 flex items-start gap-2">
                  <FaEnvelope className="text-zinc-400 mt-1 shrink-0" />
                  <span className="break-all">{student.email || "—"}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Address</div>
                <div className="text-sm font-semibold text-zinc-800 flex items-start gap-2">
                  <FaMapMarkerAlt className="text-zinc-400 mt-0.5 shrink-0" /> 
                  <span className="leading-relaxed">{student.address || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <FaUser className="text-indigo-500" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">First Name</div>
                <div className="text-sm font-semibold text-zinc-900">{student.first_name || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Last Name</div>
                <div className="text-sm font-semibold text-zinc-900">{student.last_name || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Gender</div>
                <div className="text-sm font-semibold text-zinc-900 capitalize">{student.gender || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Date of Birth</div>
                <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <FaCalendarAlt className="text-zinc-400" /> {student.date_of_birth_label || student.date_of_birth || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Father's Name</div>
                <div className="text-sm font-semibold text-zinc-900">{student.father_name || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Mother's Name</div>
                <div className="text-sm font-semibold text-zinc-900">{student.mother_name || "—"}</div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <FaFileAlt className="text-indigo-500" /> Academic Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Admission Date</div>
                <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <FaCalendarAlt className="text-zinc-400" /> {student.admission_date || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">Academic Year</div>
                <div className="text-sm font-semibold text-zinc-900">{student.academic_year || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-500 mb-1">APAAR ID</div>
                <div className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit border border-indigo-100">{student.apaar_id || "—"}</div>
              </div>
              {student.stream && (
                <div>
                  <div className="text-xs font-medium text-zinc-500 mb-1">Academic Stream</div>
                  <div className="text-sm font-semibold text-zinc-900">{student.stream}</div>
                </div>
              )}
            </div>
          </div>

          {/* Documents & QR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <FaFileAlt className="text-indigo-500" /> Documents
              </h3>
              <div className="space-y-3">
                {['birth_certificate', 'aadhaar', 'transfer_certificate'].map(docKey => {
                  const url = student.documents?.[docKey];
                  const label = docKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  return (
                    <div key={docKey} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${url ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-200 text-zinc-400'}`}>
                          <FaFileAlt />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-800">{label}</div>
                          <div className="text-xs text-zinc-500">{url ? 'Uploaded' : 'Not uploaded'}</div>
                        </div>
                      </div>
                      {url && (
                        <button 
                          onClick={() => openDocument(url)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={`View ${label}`}
                        >
                          <FaDownload />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2 self-start">
                <FaQrcode className="text-indigo-500" /> Identity QR Code
              </h3>
              
              {student.qr_image || student.qr_url ? (
                <div className="p-4 bg-white border border-zinc-200 shadow-sm rounded-2xl">
                  <img 
                    src={student.qr_image || student.qr_url} 
                    alt="Student QR Code" 
                    className="w-32 h-32"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400">
                  <FaQrcode className="w-12 h-12 opacity-50" />
                </div>
              )}
              <p className="text-xs text-zinc-500 mt-4 max-w-[200px]">
                Scan to verify student identity and access records digitally.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ID Card Modal */}
      {idCardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-zinc-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <FaIdCard className="text-indigo-500" /> Student ID Card
              </h3>
              <button 
                onClick={() => setIdCardModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 -mr-2"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {idCardLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <PageLoader size="md" />
                  <p className="mt-4 text-sm text-zinc-500 font-medium">Generating ID Card...</p>
                </div>
              ) : idCardData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {idCardData.student?.photo ? (
                      <img src={idCardData.student.photo} alt="Student" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
                        {idCardData.student?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-zinc-900">{idCardData.student?.full_name || "Unknown Student"}</h4>
                      <p className="text-sm text-zinc-500">ID: {idCardData.student?.student_id || "—"}</p>
                      <p className="text-xs text-zinc-500 mt-1">Class {idCardData.student?.class || "—"} • Section {idCardData.student?.section || "—"}</p>
                    </div>
                  </div>

                  {idCardData.themes && idCardData.themes.length > 0 && (
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-zinc-700">Select Print Theme</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {idCardData.themes.map(theme => (
                          <button
                            key={theme.key}
                            onClick={() => handlePrintIdCard(theme.url)}
                            className="flex flex-col items-start p-3 bg-white border border-zinc-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-left"
                          >
                            <span className="font-bold text-sm text-zinc-900">{theme.label}</span>
                            <span className="text-xs text-indigo-600 font-medium mt-1">Print →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!idCardData.themes || idCardData.themes.length === 0 ? (
                    <div className="pt-4 flex justify-end">
                      <Button onClick={() => handlePrintIdCard(idCardData.print_url || idCardData.id_card_url)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        Print ID Card
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-rose-500">Failed to load ID card data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
