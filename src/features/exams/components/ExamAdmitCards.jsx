"use client";

import { useState } from "react";
import { FaSearch, FaPrint, FaEye, FaUser } from "react-icons/fa";
import { getExamAdmitCardDetail } from "@/features/admin/services/exam.service";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function ExamAdmitCards({ examId, students = [], classes = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [activeCardDetail, setActiveCardDetail] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Class / section filtering
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const sections = currentClass?.sections || [];

  const filteredStudents = students.filter((stu) => {
    const text = searchTerm.toLowerCase();
    const matchesSearch =
      stu.full_name?.toLowerCase().includes(text) ||
      stu.student_id?.toLowerCase().includes(text) ||
      stu.roll_no?.toLowerCase().includes(text);

    // Let's filter on class/section if selected
    // Note: stu.class and stu.section are strings in response, e.g. "Class 1", "A"
    const matchesClass = selectedClassId
      ? stu.class?.toLowerCase() === currentClass?.name?.toLowerCase()
      : true;
    const matchesSection = selectedSectionId
      ? stu.section?.toLowerCase() === sections.find((s) => s.id === selectedSectionId)?.name?.toLowerCase()
      : true;

    return matchesSearch && matchesClass && matchesSection;
  });

  const handleViewCardDetail = async (studentId) => {
    try {
      setLoadingCard(true);
      const data = await getExamAdmitCardDetail(examId, studentId);
      setActiveCardDetail(data);
      setIsModalOpen(true);
    } catch (err) {
      toast.error("Failed to load admit card details: " + (err.message || err));
    } finally {
      setLoadingCard(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("admit-card-print-area");
    const windowUrl = "about:blank";
    const uniqueName = new Date().getTime();
    const printWindow = window.open(windowUrl, uniqueName, "left=500,top=500,width=900,height=900");

    printWindow.document.write(`
      <html>
        <head>
          <title>Admit Card - ${activeCardDetail?.student?.full_name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .card { border: 2px solid #ccc; border-radius: 12px; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #5b21b6; padding-bottom: 10px; margin-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: bold; color: #5b21b6; }
            .admit-title { font-size: 16px; font-weight: bold; color: #4b5563; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .student-info { font-size: 14px; line-height: 1.6; }
            .photo { width: 100px; height: 100px; border-radius: 8px; border: 1px solid #ddd; object-fit: cover; }
            .schedule-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            .schedule-table th { bg-color: #f3f4f6; font-weight: bold; }
            .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; border-top: 1px solid #ddd; pt: 10px; }
            .qr-code { width: 80px; height: 80px; }
            @media print {
              body { padding: 0; }
              .card { border: 2px solid #000; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-extrabold text-zinc-800 text-sm mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Class"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId("");
            }}
            options={[
              { value: "", label: "All Classes" },
              ...classes.map((c) => ({ value: c.id, label: c.name }))
            ]}
          />
          <Select
            label="Section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            options={[
              { value: "", label: "All Sections" },
              ...sections.map((s) => ({ value: s.id, label: s.name }))
            ]}
            disabled={!selectedClassId}
          />
          <div className="relative flex items-end">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pb-3 pointer-events-none text-zinc-400">
              <FaSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl outline-none font-semibold text-xs text-black focus:border-violet-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 font-medium text-xs">
          No students found matching current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredStudents.map((stu) => (
            <div
              key={stu.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {stu.photo_url ? (
                  <img
                    src={stu.photo_url}
                    alt={stu.full_name}
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 border border-violet-100">
                    <FaUser className="w-6 h-6" />
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-zinc-800 text-xs">{stu.full_name}</h4>
                  <p className="text-zinc-400 text-[10px] font-semibold">{stu.student_id}</p>
                  <p className="text-zinc-500 text-[10px] font-semibold">
                    Class: {stu.class} ({stu.section})
                  </p>
                  <p className="text-zinc-500 text-[10px] font-semibold">Roll No: {stu.roll_no}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewCardDetail(stu.id)}
                  disabled={loadingCard}
                  className="py-1 text-[10px] font-bold"
                >
                  <FaEye className="mr-1" /> View Card
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admit Card Detail Modal */}
      {isModalOpen && activeCardDetail && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Admit Card Viewer"
          size="md"
        >
          <div className="space-y-4">
            {/* Print Area Wrapper */}
            <div id="admit-card-print-area" className="p-4 bg-white border border-zinc-200 rounded-xl">
              <div className="card">
                <div className="header">
                  <div>
                    <div className="school-name">{activeCardDetail.school?.name}</div>
                    <div className="admit-title">{activeCardDetail.exam?.type_label} Admit Card</div>
                  </div>
                  <div>
                    {activeCardDetail.student?.photo_url ? (
                      <img
                        src={activeCardDetail.student.photo_url}
                        alt="Photo"
                        className="photo"
                      />
                    ) : (
                      <div className="photo bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <FaUser className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="meta">
                  <div className="student-info">
                    <strong>Name:</strong> {activeCardDetail.student?.full_name}<br />
                    <strong>ID:</strong> {activeCardDetail.student?.student_id}<br />
                    <strong>Class:</strong> {activeCardDetail.student?.class} ({activeCardDetail.student?.section})<br />
                    <strong>Roll No:</strong> {activeCardDetail.student?.roll_no}
                  </div>
                  <div>
                    {activeCardDetail.qr_image && (
                      <img
                        src={activeCardDetail.qr_image}
                        alt="QR Code"
                        className="qr-code"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCardDetail.schedules?.map((sch) => (
                        <tr key={sch.id}>
                          <td style={{ textTransform: "capitalize" }}>{sch.subject}</td>
                          <td>{sch.exam_date}</td>
                          <td>{sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}</td>
                          <td>{sch.room}</td>
                        </tr>
                      ))}
                      {(!activeCardDetail.schedules || activeCardDetail.schedules.length === 0) && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "#9ca3af" }}>
                            No exam dates mapped for this student's class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="footer">
                  <div style={{ fontSize: "10px", color: "#6b7280" }}>
                    Exam Center: {activeCardDetail.exam?.exam_center || "School Campus"}
                  </div>
                  <div style={{ borderTop: "1px solid #000", width: "120px", marginTop: "20px", textAlign: "center", fontSize: "10px", paddingTop: "5px" }}>
                    Principal Signature
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handlePrint}>
                <FaPrint className="mr-1.5" /> Print Admit Card
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
