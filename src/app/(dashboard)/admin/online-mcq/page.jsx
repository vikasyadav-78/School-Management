"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import {
  FaPlus, FaTimes, FaCheck, FaTrash, FaQuestionCircle, FaFileAlt, FaGlobe, FaClock, FaCheckCircle, FaInfoCircle, FaShieldAlt, FaListOl, FaExclamationTriangle, FaFilter, FaSearch
} from "react-icons/fa";
import {
  getAdminOnlineMcqMeta,
  getAdminOnlineMcq,
  addAdminOnlineMcqExam,
  getAdminOnlineMcqExamDetail,
  addAdminOnlineMcqQuestion,
  deleteAdminOnlineMcqQuestion,
  publishAdminOnlineMcqExam,
  deleteAdminOnlineMcqExam
} from "@/features/admin/services/admin.service";
import {
  toDateTimeLocalString,
  getFutureDateTimeLocalString,
  computeScheduleStatus,
  formatDateTime
} from "@/utils/timeUtils";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AdminOnlineMcqPage() {
  const dialog = useAppDialog();
  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const [activeExam, setActiveExam] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [startsAt, setStartsAt] = useState(toDateTimeLocalString());
  const [endsAt, setEndsAt] = useState(getFutureDateTimeLocalString(2));
  const [instructions, setInstructions] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [fullscreenRequired, setFullscreenRequired] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("mcq_single");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [questionMarks, setQuestionMarks] = useState("1");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Auto-calculate End Date & Time based on Start Date & Time + Duration
  useEffect(() => {
    if (startsAt && durationMinutes) {
      const minutes = parseInt(durationMinutes);
      if (!isNaN(minutes) && minutes > 0) {
        const startDateObj = new Date(startsAt);
        if (!isNaN(startDateObj.getTime())) {
          const endDateObj = new Date(startDateObj.getTime() + minutes * 60 * 1000);
          
          // Format as datetime-local string (YYYY-MM-DDTHH:MM)
          const year = endDateObj.getFullYear();
          const month = String(endDateObj.getMonth() + 1).padStart(2, "0");
          const day = String(endDateObj.getDate()).padStart(2, "0");
          const hours = String(endDateObj.getHours()).padStart(2, "0");
          const mins = String(endDateObj.getMinutes()).padStart(2, "0");
          
          setEndsAt(`${year}-${month}-${day}T${hours}:${mins}`);
        }
      }
    }
  }, [startsAt, durationMinutes]);

  const loadMeta = async () => {
    try {
      setLoading(true);
      const metaData = await getAdminOnlineMcqMeta();
      setMeta(metaData.meta || metaData.data || metaData);

      const listData = await getAdminOnlineMcq();
      setExams(listData.exams || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      if (err.status === 403 || err.statusCode === 403 || (err.message && err.message.includes("403"))) {
        setForbidden(true);
      } else {
        toast.error("Failed to load Online MCQ module: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  const refreshList = async () => {
    try {
      setListLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (classFilter !== "all") params.class_id = classFilter;
      const listData = await getAdminOnlineMcq(params);
      setExams(listData.exams || listData.data || (Array.isArray(listData) ? listData : []));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !forbidden) {
      refreshList();
    }
  }, [statusFilter, classFilter]);

  const handleOpenDetail = async (exam) => {
    try {
      const detailed = await getAdminOnlineMcqExamDetail(exam.id);
      setActiveExam(detailed.exam || detailed.data || detailed || exam);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast.error("Failed to load exam details: " + (err.message || err));
    }
  };

  const resetExamForm = () => {
    setExamTitle("");
    setSubjectId("");
    setClassId("");
    setSectionId("");
    setDurationMinutes("");
    setStartsAt(toDateTimeLocalString());
    setEndsAt(getFutureDateTimeLocalString(2));
    setInstructions("");
    setNegativeMarking(false);
    setNegativeMarks("");
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setFullscreenRequired(false);
    setAutoSubmit(false);
    setFormError("");
  };

  const handleOpenAddExam = () => {
    resetExamForm();
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!examTitle.trim() || !subjectId || !classId) {
      setFormError("Exam Title, Subject, and Class are required fields.");
      return;
    }

    if (!durationMinutes || parseInt(durationMinutes) <= 0) {
      setFormError("Please enter a valid exam duration in minutes.");
      return;
    }

    if (negativeMarking && (!negativeMarks || parseFloat(negativeMarks) <= 0)) {
      setFormError("Please enter negative marks per wrong answer.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: examTitle.trim(),
        subject_id: subjectId,
        school_class_id: classId,
        section_id: sectionId || null,
        duration_minutes: parseInt(durationMinutes) || 60,
        starts_at: startsAt,
        ends_at: endsAt,
        instructions: instructions.trim() || "Complete all questions before time expires.",
        negative_marking: negativeMarking,
        negative_marks: negativeMarking ? (parseFloat(negativeMarks) || 0) : 0,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        fullscreen_required: fullscreenRequired,
        auto_submit: autoSubmit
      };

      const res = await addAdminOnlineMcqExam(payload);
      toast.success("Exam draft created successfully!");
      setIsExamModalOpen(false);

      const newExamObj = res.exam || res.data || res;
      const newExamId = newExamObj?.id;

      if (newExamId) {
        try {
          const detailed = await getAdminOnlineMcqExamDetail(newExamId);
          setActiveExam(detailed.exam || detailed.data || detailed || newExamObj);
        } catch (detailErr) {
          setActiveExam(newExamObj);
        }
        setIsDetailModalOpen(true);
        handleOpenAddQuestion();
      }

      refreshList();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create exam draft.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishExam = async (examId) => {
    const isConfirmed = await dialog.confirm({
      title: "Publish Exam",
      message: "Are you sure you want to publish this exam? Students will be able to attempt it according to the scheduled start time.",
      type: "info",
      confirmText: "Publish",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await publishAdminOnlineMcqExam(examId);
      toast.success("Exam published successfully!");
      if (activeExam?.id === examId) {
        const detailed = await getAdminOnlineMcqExamDetail(examId);
        setActiveExam(detailed.exam || detailed.data || detailed);
      }
      refreshList();
    } catch (err) {
      toast.error("Failed to publish exam: " + (err.message || err));
    }
  };

  const handleDeleteExam = async (examId) => {
    const isConfirmed = await dialog.confirm({
      title: "Delete Exam",
      message: "Are you sure you want to delete this MCQ exam? This action cannot be undone.",
      type: "delete",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteAdminOnlineMcqExam(examId);
      toast.success("Exam deleted successfully!");
      if (activeExam?.id === examId) {
        setIsDetailModalOpen(false);
        setActiveExam(null);
      }
      refreshList();
    } catch (err) {
      toast.error("Failed to delete exam: " + (err.message || err));
    }
  };

  const handleOpenAddQuestion = () => {
    setQuestionText("");
    setQuestionType("mcq_single");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setQuestionMarks("1");
    setFormError("");
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e, keepModalOpen = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError("");

    if (!questionText.trim()) {
      setFormError("Question prompt text is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        question: questionText.trim(),
        question_type: questionType,
        option_a: optionA.trim(),
        option_b: optionB.trim(),
        option_c: optionC.trim(),
        option_d: optionD.trim(),
        correct_answer: correctAnswer,
        marks: parseFloat(questionMarks) || 1
      };

      await addAdminOnlineMcqQuestion(activeExam.id, payload);
      toast.success("Question added! Ready for next question.");

      if (activeExam?.id) {
        const detailed = await getAdminOnlineMcqExamDetail(activeExam.id);
        setActiveExam(detailed.exam || detailed.data || detailed);
      }

      if (keepModalOpen) {
        setQuestionText("");
        setOptionA("");
        setOptionB("");
        setOptionC("");
        setOptionD("");
        setCorrectAnswer("A");
        setFormError("");
      } else {
        setIsQuestionModalOpen(false);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to add question to exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const isConfirmed = await dialog.confirm({
      title: "Remove Question",
      message: "Are you sure you want to remove this question from the exam bank?",
      type: "delete",
      confirmText: "Remove",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await deleteAdminOnlineMcqQuestion(activeExam.id, questionId);
      toast.success("Question removed!");
      if (activeExam?.id) {
        const detailed = await getAdminOnlineMcqExamDetail(activeExam.id);
        setActiveExam(detailed.exam || detailed.data || detailed);
      }
    } catch (err) {
      toast.error("Failed to remove question: " + (err.message || err));
    }
  };

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm text-xs max-w-lg mx-auto mt-10">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
            <FaTimes className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Access Restricted</h2>
          <p className="text-zinc-500 font-bold leading-relaxed mt-2">
            Online MCQ Exam Creator is not enabled for your account. Please contact your school administrator.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  const selectedClassObj = meta?.classes?.find((c) => c.id.toString() === classId);
  const sections = selectedClassObj?.sections || meta?.sections || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in text-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Online MCQ Exam Creator"
            subtitle="Create exam drafts, manage question banks, and publish scheduled unit tests from a single admin flow."
          />
          <div className="flex gap-2 self-start sm:self-auto">
            <Link href="/admin/online-mcq/reports">
              <button
                type="button"
                className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm text-xs uppercase tracking-wider"
              >
                View Reports
              </button>
            </Link>
            <button
              onClick={handleOpenAddExam}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm text-xs uppercase tracking-wider"
            >
              <FaPlus className="w-3.5 h-3.5" />
              Create Exam Draft
            </button>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Exam Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Exam Statuses</option>
              <option value="draft">Drafts Only</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="w-full">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Classes</option>
              {meta?.classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-20"><PageLoader /></div>
        ) : exams.length === 0 ? (
          <EmptyState title="No MCQ Exams Found" desc="Click 'Create Exam Draft' above to build your first online examination." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((e) => {
              const calculatedStatus = computeScheduleStatus(e.starts_at, e.ends_at, e.status);
              const isPublished = e.is_published || e.status === "published";

              return (
                <div key={e.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                          isPublished ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                        }`}>
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <button onClick={() => handleDeleteExam(e.id)} className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer" title="Delete Exam">
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-extrabold text-zinc-800 text-sm mb-1 uppercase tracking-wide">{e.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-3">
                      Subject: <span className="text-zinc-700 capitalize">{e.subject_name || e.subject}</span> • Class: <span className="text-zinc-700">{e.class_name || e.class}</span>
                    </span>

                    <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      <div className="flex justify-between"><span>Questions:</span><span className="font-bold text-zinc-800">{e.questions_count || e.questions?.length || 0}</span></div>
                      <div className="flex justify-between"><span>Duration:</span><span className="font-bold text-zinc-800">{e.duration_minutes || 60} Mins</span></div>
                      <div className="flex justify-between"><span>Starts At:</span><span className="font-bold text-zinc-800">{e.starts_at_label || formatDateTime(e.starts_at)}</span></div>
                      <div className="flex justify-between"><span>Ends At:</span><span className="font-bold text-zinc-800">{e.ends_at_label || formatDateTime(e.ends_at)}</span></div>
                      <div className="flex justify-between"><span>Negative Marking:</span><span className="font-bold text-zinc-800">{e.negative_marking ? `Yes (-${e.negative_marks})` : "No"}</span></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-100">
                    <button onClick={() => handleOpenDetail(e)} className="flex-1 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] uppercase tracking-wider">
                      <FaFileAlt className="w-3.5 h-3.5" /> Question Bank
                    </button>

                    {!isPublished && (
                      <button onClick={() => handlePublishExam(e.id)} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer text-[11px] uppercase tracking-wider shadow-sm">
                        <FaGlobe className="w-3 h-3" /> Publish
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaQuestionCircle className="text-violet-500" />
                Configure New MCQ Examination
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
              {formError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-bold">{formError}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Exam Title *</label>
                <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="e.g. Mid-Term Physics Unit Test" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject *</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">Select Subject</option>
                    {meta?.subjects?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class *</label>
                  <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">Select Class</option>
                    {meta?.classes?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Duration (Minutes) *</label>
                  <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="e.g. 60" className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section (Optional)</label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="">All Sections</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Start Date & Time *</label>
                  <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-[11px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">End Date & Time *</label>
                  <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-[11px]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Exam Instructions (Optional)</label>
                <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Enter custom instructions for students..." className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold resize-none" />
              </div>

              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-150 space-y-3">
                <span className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wider block border-b border-zinc-200/80 pb-1.5">Exam Rules & Security Options</span>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2"><input type="checkbox" id="shuffleQ" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} className="w-4 h-4 text-violet-600 rounded cursor-pointer" /><label htmlFor="shuffleQ" className="text-[10px] font-bold text-zinc-600 uppercase cursor-pointer">Shuffle Question Order</label></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="shuffleOpt" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="w-4 h-4 text-violet-600 rounded cursor-pointer" /><label htmlFor="shuffleOpt" className="text-[10px] font-bold text-zinc-600 uppercase cursor-pointer">Shuffle Options Order</label></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="fullScreen" checked={fullscreenRequired} onChange={(e) => setFullscreenRequired(e.target.checked)} className="w-4 h-4 text-violet-600 rounded cursor-pointer" /><label htmlFor="fullScreen" className="text-[10px] font-bold text-zinc-600 uppercase cursor-pointer">Full Screen Mode</label></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="autoSub" checked={autoSubmit} onChange={(e) => setAutoSubmit(e.target.checked)} className="w-4 h-4 text-violet-600 rounded cursor-pointer" /><label htmlFor="autoSub" className="text-[10px] font-bold text-zinc-600 uppercase cursor-pointer">Auto Submit When Time Ends</label></div>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 space-y-2">
                  <div className="flex items-center gap-2"><input type="checkbox" id="negMarking" checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} className="w-4 h-4 text-violet-600 rounded cursor-pointer" /><label htmlFor="negMarking" className="text-[10px] font-bold text-zinc-600 uppercase cursor-pointer">Enable Negative Marking</label></div>

                  {negativeMarking && (
                    <div className="space-y-1 pl-6 animate-fade-in">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Negative Marks Per Wrong Answer</label>
                      <input type="number" step="0.01" value={negativeMarks} onChange={(e) => setNegativeMarks(e.target.value)} placeholder="e.g. 0.25, 0.50, 1" className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsExamModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs cursor-pointer">{submitting ? "Creating Exam..." : "Create Exam & Add Questions"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && activeExam && (() => {
        const questionsList = activeExam.questions || [];
        const totalMarksSum = questionsList.reduce((acc, q) => acc + (parseFloat(q.marks) || 1), 0);
        const mcqCount = questionsList.filter((q) => q.question_type === "mcq_single").length;
        const fillBlankCount = questionsList.filter((q) => q.question_type === "fill_blank").length;
        const isPublished = activeExam.is_published || activeExam.status === "published";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-up text-left flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <FaFileAlt className="text-violet-500" />
                  Question Bank: <span className="text-violet-600">{activeExam.title}</span>
                </h3>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-violet-900 font-extrabold text-xs">
                    <FaInfoCircle className="w-4 h-4 text-violet-600 shrink-0" />
                    Examination Workflow Guide
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[10px] text-zinc-600 font-semibold pt-1">
                    <div><strong className="text-violet-700">1. Draft Created:</strong> Exam settings configured.</div>
                    <div><strong className="text-violet-700">2. Add Questions:</strong> Construct exam question bank.</div>
                    <div><strong className="text-violet-700">3. Review Allocations:</strong> Verify marks & duration.</div>
                    <div><strong className="text-violet-700">4. Publish Exam:</strong> Activate test for students.</div>
                    <div><strong className="text-violet-700">5. Student Access:</strong> Test becomes live at start time.</div>
                  </div>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 bg-white rounded-xl border border-zinc-100 shadow-2xs"><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Questions</span><span className="text-base font-black text-zinc-800">{questionsList.length}</span></div>
                  <div className="p-2 bg-white rounded-xl border border-zinc-100 shadow-2xs"><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Marks</span><span className="text-base font-black text-violet-600">{totalMarksSum || activeExam.total_marks || 0}</span></div>
                  <div className="p-2 bg-white rounded-xl border border-zinc-100 shadow-2xs"><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">MCQ / Blanks</span><span className="text-xs font-black text-zinc-800">{mcqCount} MCQ / {fillBlankCount} Blank</span></div>
                  <div className="p-2 bg-white rounded-xl border border-zinc-100 shadow-2xs"><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Status</span><span className={`text-xs font-black uppercase ${isPublished ? "text-emerald-600" : "text-amber-600"}`}>{isPublished ? "Published" : "Draft"}</span></div>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <h4 className="font-extrabold text-zinc-800 text-xs">Questions List ({questionsList.length})</h4>

                  <div className="flex items-center gap-2">
                    <button onClick={handleOpenAddQuestion} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs">
                      <FaPlus className="w-3 h-3" /> Add Question
                    </button>

                    {!isPublished && (
                      <button onClick={() => handlePublishExam(activeExam.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs">
                        <FaGlobe className="w-3 h-3" /> Publish Exam
                      </button>
                    )}
                  </div>
                </div>

                {questionsList.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic text-center py-6">No questions added to this exam bank yet. Click 'Add Question' above to add questions.</p>
                ) : (
                  <div className="space-y-3">
                    {questionsList.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col justify-between gap-2">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-zinc-800 text-xs">Q{idx + 1}. {q.question}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase">{q.marks || 1} Marks</span>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer" title="Delete Question">
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {q.question_type === "mcq_single" && (
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-600 pt-2 border-t border-zinc-100">
                            <div className={q.correct_answer === "A" ? "font-bold text-emerald-600" : ""}>A) {q.option_a || q.options?.A || "—"}</div>
                            <div className={q.correct_answer === "B" ? "font-bold text-emerald-600" : ""}>B) {q.option_b || q.options?.B || "—"}</div>
                            <div className={q.correct_answer === "C" ? "font-bold text-emerald-600" : ""}>C) {q.option_c || q.options?.C || "—"}</div>
                            <div className={q.correct_answer === "D" ? "font-bold text-emerald-600" : ""}>D) {q.option_d || q.options?.D || "—"}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer">Close Inspector</button>
              </div>
            </div>
          </div>
        );
      })()}

      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm">Add Question to Exam</h3>
              <button onClick={() => setIsQuestionModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <form onSubmit={(e) => handleSaveQuestion(e, false)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {formError && <div className="p-2 bg-rose-50 text-rose-600 text-xs rounded font-bold">{formError}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Question Prompt *</label>
                <textarea rows={2} value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter problem question prompt..." className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Option A</label><input type="text" value={optionA} onChange={(e) => setOptionA(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Option B</label><input type="text" value={optionB} onChange={(e) => setOptionB(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Option C</label><input type="text" value={optionC} onChange={(e) => setOptionC(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Option D</label><input type="text" value={optionD} onChange={(e) => setOptionD(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Correct Option *</label>
                  <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-bold text-zinc-700 cursor-pointer">
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Marks *</label>
                  <input type="number" value={questionMarks} onChange={(e) => setQuestionMarks(e.target.value)} className="w-full px-3 py-1.5 border border-zinc-200 rounded-xl outline-none text-black font-semibold" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="px-3 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="button" disabled={submitting} onClick={(e) => handleSaveQuestion(e, true)} className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer">
                  <FaPlus className="w-3 h-3" /> Save & Add Next Question
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs cursor-pointer">{submitting ? "Saving..." : "Save & Close"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}