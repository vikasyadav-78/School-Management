"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { 
  FaClock, FaFileAlt, FaCheckCircle, FaAward, FaTrophy, FaArrowRight, FaTimes, FaShieldAlt, FaInfoCircle, FaCalendarAlt, FaLayerGroup, FaExclamationTriangle, FaArrowLeft, FaSearch
} from "react-icons/fa";
import { 
  getStudentOnlineMcqExams,
  getStudentOnlineMcqExamDetail,
  startStudentOnlineMcqExam,
  getStudentOnlineMcqAttempt,
  saveStudentOnlineMcqAnswer,
  submitStudentOnlineMcqExam,
  logStudentOnlineMcqEvent,
  getStudentOnlineMcqResult,
  downloadStudentOnlineMcqCertificate
} from "@/features/students/services/module.service";
import { toast } from "sonner";
import { useAppDialog } from "@/context/DialogContext";

export default function StudentOnlineMcqPage() {
  const dialog = useAppDialog();
  const [activeTab, setActiveTab] = useState("available"); // "available" | "upcoming" | "completed"
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // Raw API Sections & Counts
  const [availableExams, setAvailableExams] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [counts, setCounts] = useState({ available: 0, upcoming: 0, completed: 0 });

  // Exam Details Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Active Exam Attempt State
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answersMap, setAnswersMap] = useState({}); // { question_id: "A" }
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Result & Leaderboard Modal State
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const loadExams = async () => {
    try {
      setListLoading(true);
      const res = await getStudentOnlineMcqExams();
      
      const avail = res.available || [];
      const upcom = res.upcoming || [];
      const compl = res.completed || [];
      
      setAvailableExams(avail);
      setUpcomingExams(upcom);
      setCompletedExams(compl);

      setCounts({
        available: res.counts?.available ?? avail.length,
        upcoming: res.counts?.upcoming ?? upcom.length,
        completed: res.counts?.completed ?? compl.length
      });
    } catch (err) {
      toast.error("Failed to load MCQ exams: " + (err.message || err));
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  // Tab switch detection proctoring for active attempt
  useEffect(() => {
    if (!activeAttemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logStudentOnlineMcqEvent(activeAttemptId, { event: "tab_switched", meta: { timestamp: new Date().toISOString() } })
          .catch(() => {});
        toast.warning("Warning: Tab switching is monitored during exams!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeAttemptId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !activeAttemptId) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, activeAttemptId]);

  // Handle Exam Detail Modal Fetch
  const handleInspectExam = async (examId) => {
    try {
      setIsDetailModalOpen(true);
      setLoadingDetail(true);
      const res = await getStudentOnlineMcqExamDetail(examId);
      setSelectedExamDetail(res.exam || res.data || res);
    } catch (err) {
      toast.error("Failed to load exam details: " + (err.message || err));
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Start / Resume Exam Attempt
  const handleStartExam = async (exam) => {
    try {
      setLoadingAttempt(true);
      setAttemptError("");
      if (isDetailModalOpen) setIsDetailModalOpen(false);

      let attemptId = exam.attempt_id;

      if (!attemptId) {
        const startRes = await startStudentOnlineMcqExam(exam.id);
        attemptId = startRes.attempt?.id || startRes.attempt_id || startRes.id;
        if (!attemptId && startRes.take_url) {
          const parts = startRes.take_url.split("/");
          attemptId = parts[parts.length - 1];
        }
      }

      if (!attemptId) {
        toast.error("Failed to acquire exam attempt session.");
        setLoadingAttempt(false);
        return;
      }

      setActiveAttemptId(attemptId);

      // Fetch Full Attempt Data & Questions from Backend
      const attemptRes = await getStudentOnlineMcqAttempt(attemptId);
      
      // Store entire response object so attemptRes.questions is accessible!
      setAttemptData(attemptRes);

      const remSec = attemptRes.remaining_seconds ?? attemptRes.attempt?.remaining_seconds ?? (attemptRes.exam?.duration_minutes ? attemptRes.exam.duration_minutes * 60 : 3600);
      setTimeLeft(remSec);

      // Pre-fill answers map from saved_answer
      const questionsList = attemptRes.questions || attemptRes.attempt?.questions || [];
      const initialAnswers = {};
      questionsList.forEach(q => {
        if (q.saved_answer !== null && q.saved_answer !== undefined) {
          initialAnswers[q.id] = q.saved_answer;
        } else if (q.student_answer || q.answer) {
          initialAnswers[q.id] = q.student_answer || q.answer;
        }
      });
      setAnswersMap(initialAnswers);
      setCurrentQuestionIdx(0);
    } catch (err) {
      setAttemptError(err.response?.data?.message || err.message || "Failed to load exam attempt.");
      toast.error("Failed to load exam attempt: " + (err.message || err));
    } finally {
      setLoadingAttempt(false);
    }
  };

  // Immediate Option Selection & Answer Saving
  const handleSelectOption = async (questionId, optionKey) => {
    setAnswersMap(prev => ({ ...prev, [questionId]: optionKey }));
    try {
      await saveStudentOnlineMcqAnswer(activeAttemptId, {
        question_id: questionId,
        answer: optionKey
      });
    } catch (err) {
      console.error("Failed to save option answer:", err);
    }
  };

  // Immediate Text / Fill in Blank Answer Saving
  const handleTextAnswerChange = (questionId, textVal) => {
    setAnswersMap(prev => ({ ...prev, [questionId]: textVal }));
  };

  const handleSaveTextAnswer = async (questionId, textVal) => {
    try {
      await saveStudentOnlineMcqAnswer(activeAttemptId, {
        question_id: questionId,
        answer: textVal
      });
    } catch (err) {
      console.error("Failed to save text answer:", err);
    }
  };

  const handleSubmitExam = async () => {
    const questionsList = attemptData?.questions || attemptData?.attempt?.questions || [];
    const unansweredCount = questionsList.filter(q => !answersMap[q.id]).length;

    let confirmSubmit = false;
    if (unansweredCount > 0) {
      confirmSubmit = await dialog.confirm({
        title: "Unanswered Questions",
        message: `You still have ${unansweredCount} unanswered question(s). Are you sure you want to submit the exam?`,
        type: "warning",
        confirmText: "Submit Anyway",
        cancelText: "Cancel"
      });
    } else {
      confirmSubmit = await dialog.confirm({
        title: "Submit Exam",
        message: "Are you sure you want to submit your exam answers?",
        type: "info",
        confirmText: "Submit",
        cancelText: "Cancel"
      });
    }

    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      const res = await submitStudentOnlineMcqExam(activeAttemptId, {
        auto_submit: false
      });
      toast.success(res.message || "Exam submitted successfully!");

      const examId = attemptData?.exam?.id || attemptData?.attempt?.online_exam_id;
      const canViewResult = attemptData?.exam?.can_view_result ?? true;

      setActiveAttemptId(null);
      setAttemptData(null);
      loadExams();

      if (examId && canViewResult) {
        handleViewResult({ id: examId });
      }
    } catch (err) {
      toast.error("Failed to submit exam: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      toast.warning("Time limit expired! Auto-submitting exam...");
      await submitStudentOnlineMcqExam(activeAttemptId, {
        auto_submit: true
      });
      setActiveAttemptId(null);
      setAttemptData(null);
      loadExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewResult = async (exam) => {
    try {
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      setIsResultModalOpen(true);
      // Removed broken API call; we already have result data in the exam object itself
      setResultData(exam);
    } catch (err) {
      toast.error("Failed to load exam result: " + (err.message || err));
    }
  };

  const handleDownloadCertificate = async (examId) => {
    try {
      const data = await downloadStudentOnlineMcqCertificate(examId);
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.success("Downloading Certificate PDF...");
      }
    } catch (err) {
      toast.error("Failed to download certificate: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  // ACTIVE EXAM ATTEMPT PORTAL SCREEN
  if (activeAttemptId) {
    if (loadingAttempt) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
          <PageLoader />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Loading Exam Questions & Attempt Session...</span>
        </div>
      );
    }

    if (attemptError) {
      return (
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 mt-10 text-xs">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <FaExclamationTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-zinc-800 text-sm">Failed to Load Exam</h3>
          <p className="text-zinc-500 font-semibold">{attemptError}</p>
          <button 
            onClick={() => { setActiveAttemptId(null); loadExams(); }}
            className="px-4 py-2 bg-violet-600 text-white font-bold rounded-xl"
          >
            Back to Exams Portal
          </button>
        </div>
      );
    }

    const questions = attemptData?.questions || attemptData?.attempt?.questions || [];
    const examMeta = attemptData?.exam || attemptData?.attempt || {};
    const currentQ = questions[currentQuestionIdx];
    const minutes = Math.floor((timeLeft || 0) / 60);
    const seconds = (timeLeft || 0) % 60;
    const progressPct = questions.length > 0 ? Math.round(((currentQuestionIdx + 1) / questions.length) * 100) : 0;

    return (
      <div className="space-y-6 animate-fade-in text-xs text-left max-w-4xl mx-auto">
        {/* Header Bar with Proctoring & Timer */}
        <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block">ONLINE MCQ ATTEMPT PORTAL</span>
              <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-bold rounded">
                {examMeta.subject || "Subject"} • Class {examMeta.class || "—"} ({examMeta.section || "—"})
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">{examMeta.title || "Examination"}</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 rounded-xl border border-zinc-700 text-amber-400 font-black text-sm">
              <FaClock className="w-4 h-4 animate-spin" />
              <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>

            <button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition-all cursor-pointer text-xs"
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>

        {/* Progress Bar Section */}
        {questions.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
              <span>Question Progress ({currentQuestionIdx + 1} of {questions.length})</span>
              <span>{progressPct}% Completed</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200/60">
              <div 
                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Question & Answer Card */}
        {questions.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center space-y-4">
            <p className="text-zinc-500 font-extrabold text-sm">No questions found for this exam.</p>
            <button 
              onClick={() => { setActiveAttemptId(null); loadExams(); }}
              className="px-4 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs"
            >
              Return to Exams List
            </button>
          </div>
        ) : currentQ ? (() => {
          const isMcq = currentQ.question_type === "mcq_single" || !currentQ.question_type || currentQ.options;
          const optionsObj = currentQ.options || {};
          const optionKeys = Object.keys(optionsObj).length > 0 ? Object.keys(optionsObj).sort() : ["A", "B", "C", "D"];

          return (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <span className="font-extrabold text-zinc-800 text-sm">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Type: {currentQ.question_type === "fill_blank" ? "Fill in the Blank" : "MCQ (Single Choice)"}
                  </span>
                  <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 uppercase">
                    {currentQ.marks || 1} Marks
                  </span>
                </div>
              </div>

              <p className="text-sm font-extrabold text-zinc-800 leading-relaxed">
                {currentQ.question}
              </p>

              {/* MCQ Options Rendering */}
              {isMcq && (
                <div className="space-y-3 pt-2">
                  {optionKeys.map(optKey => {
                    const optText = optionsObj[optKey] || currentQ[`option_${optKey.toLowerCase()}`];
                    if (!optText) return null;
                    const isSelected = answersMap[currentQ.id] === optKey;

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optKey)}
                        className={`w-full p-4 rounded-xl border text-left font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-violet-50 border-violet-500 text-violet-900 shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected ? "bg-violet-600 text-white" : "bg-zinc-200 text-zinc-600"
                          }`}>
                            {optKey}
                          </span>
                          <span className="text-xs">{optText}</span>
                        </div>
                        {isSelected && <FaCheckCircle className="text-violet-600 w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the Blank Input */}
              {currentQ.question_type === "fill_blank" && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Your Answer</label>
                  <input
                    type="text"
                    value={answersMap[currentQ.id] || ""}
                    onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                    onBlur={(e) => handleSaveTextAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your answer text here..."
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                  />
                </div>
              )}

              {/* Navigation & Question Palette */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-100">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="w-full sm:w-auto px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Previous Question
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        currentQuestionIdx === idx
                          ? "bg-violet-600 text-white shadow-sm ring-2 ring-violet-300"
                          : answersMap[q.id]
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                      title={`Jump to Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIdx === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitExam}
                    disabled={submitting}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FaCheckCircle className="w-3.5 h-3.5" /> {submitting ? "Submitting..." : "Submit Exam"}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="w-full sm:w-auto px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    Next <FaArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })() : null}
      </div>
    );
  }

  // Active Tab Exam List Selection with Search Filter
  const baseExamsList = activeTab === "available" ? availableExams : activeTab === "upcoming" ? upcomingExams : completedExams;
  const currentExamsList = baseExamsList.filter(e => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchTitle = (e.title || "").toLowerCase().includes(q);
    const matchSubject = (e.subject || e.subject_name || "").toLowerCase().includes(q);
    const matchClass = (e.class || "").toLowerCase().includes(q);
    const matchSection = (e.section || "").toLowerCase().includes(q);
    return matchTitle || matchSubject || matchClass || matchSection;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left">
      <PageHeader 
        title="Online MCQ Examinations Portal"
        subtitle="Take online unit tests, track exam schedules, and view performance results."
      />

      {/* Summary Counters & Tabs */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2 font-bold uppercase text-[12px] tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "available" ? "bg-violet-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Available Exams
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "available" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"}`}>
              {counts.available}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 font-bold uppercase text-[12px] tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "upcoming" ? "bg-violet-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Upcoming Exams
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"}`}>
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 font-bold uppercase text-[12px] tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "completed" ? "bg-violet-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Completed Exams
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "completed" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"}`}>
              {counts.completed}
            </span>
          </button>
        </div>
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-2.5 text-zinc-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-xs font-semibold focus:bg-white focus:border-violet-500 transition-all text-zinc-800"
          />
        </div>
      </div>

      {/* Exam Cards Grid */}
      {listLoading ? (
        <div className="flex items-center justify-center py-20"><PageLoader /></div>
      ) : currentExamsList.length === 0 ? (
        <EmptyState 
          title={searchTerm.trim() ? "No exams found" : activeTab === "upcoming" ? "No Upcoming Exams" : activeTab === "completed" ? "No Completed Exams" : "No Available Exams"} 
          desc={searchTerm.trim() ? "No examinations match your search criteria." : activeTab === "upcoming" ? "No examinations currently scheduled for upcoming dates." : activeTab === "completed" ? "No completed examinations in your history." : "No active examinations currently available for attempt."} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentExamsList.map(e => {
            const canStart = e.can_start ?? (e.status === "active" && (!e.attempt_status || e.attempt_status === "not_started"));
            const canContinue = e.can_continue ?? (e.attempt_status && e.attempt_status !== "completed" && !e.is_submitted);
            const canViewResult = e.can_view_result ?? (e.is_submitted || e.attempt_status === "completed");

            return (
              <div key={e.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase ${
                      e.status === "active" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                      e.status === "expired" ? "bg-rose-50 border-rose-100 text-rose-600" :
                      "bg-violet-50 border-violet-100 text-violet-600"
                    }`}>
                      {e.status || "Scheduled"}
                    </span>

                    {e.attempt_status && (
                      <span className="inline-flex px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-lg text-[8px] font-black uppercase">
                        {e.attempt_status}
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-zinc-800 text-sm mb-1">{e.title}</h4>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-3">
                    Subject: <span className="text-zinc-800 capitalize">{e.subject || e.subject_name || "N/A"}</span> • Class {e.class || "—"} ({e.section || "—"})
                  </div>

                  <div className="space-y-1.5 text-[10px] font-semibold text-zinc-500 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <div className="flex justify-between"><span>Duration:</span><span className="font-bold text-zinc-800">{e.duration_minutes || 60} Mins</span></div>
                    <div className="flex justify-between"><span>Total Questions:</span><span className="font-bold text-zinc-800">{e.total_questions || e.questions_count || 0}</span></div>
                    <div className="flex justify-between"><span>Total Marks:</span><span className="font-bold text-zinc-800">{e.total_marks || 0}</span></div>
                    <div className="flex justify-between"><span>Starts At:</span><span className="font-bold text-zinc-800">{e.starts_at_label || e.starts_at || "—"}</span></div>
                    <div className="flex justify-between"><span>Ends At:</span><span className="font-bold text-zinc-800">{e.ends_at_label || e.ends_at || "—"}</span></div>
                    <div className="flex justify-between"><span>Negative Marking:</span><span className="font-bold text-zinc-800">{e.negative_marking ? `Yes (${e.negative_marks || 0} marks)` : "No"}</span></div>
                    
                    {e.score !== null && e.score !== undefined && (
                      <div className="flex justify-between border-t border-zinc-200/60 pt-1 text-violet-700">
                        <span>Score:</span>
                        <span className="font-black">{e.score} / {e.total_marks} ({e.percentage}%) {e.grade ? `• Grade: ${e.grade}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    {canContinue ? (
                      <button
                        onClick={() => handleStartExam(e)}
                        disabled={e.can_continue === false}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <FaFileAlt className="w-3.5 h-3.5" /> Continue Exam
                      </button>
                    ) : canStart ? (
                      <button
                        onClick={() => handleStartExam(e)}
                        disabled={e.can_start === false}
                        className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <FaFileAlt className="w-3.5 h-3.5" /> Start Exam
                      </button>
                    ) : canViewResult ? (
                      <button
                        onClick={() => handleViewResult(e)}
                        disabled={e.can_view_result === false}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <FaTrophy className="w-3.5 h-3.5" /> View Result
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInspectExam(e.id)}
                        className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <FaInfoCircle className="w-3.5 h-3.5" /> View Details
                      </button>
                    )}

                    <button
                      onClick={() => handleInspectExam(e.id)}
                      className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-all cursor-pointer"
                      title="Inspect Exam Details"
                    >
                      <FaInfoCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam Details Inspector Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-left flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaFileAlt className="text-violet-500" /> Exam Details & Rules
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><FaTimes className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-10"><PageLoader /></div>
              ) : selectedExamDetail ? (
                <>
                  <div>
                    <h4 className="font-extrabold text-zinc-800 text-base mb-0.5">{selectedExamDetail.title}</h4>
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider block">
                      {selectedExamDetail.subject} • Class {selectedExamDetail.class} ({selectedExamDetail.section})
                    </span>
                  </div>

                  {selectedExamDetail.instructions && (
                    <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl text-xs text-violet-900 font-medium">
                      <strong className="block font-bold text-violet-950 mb-0.5">Instructions:</strong>
                      {selectedExamDetail.instructions}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-100 font-semibold text-zinc-600">
                    <div>Duration: <strong className="text-zinc-800">{selectedExamDetail.duration_minutes} Mins</strong></div>
                    <div>Questions: <strong className="text-zinc-800">{selectedExamDetail.total_questions || selectedExamDetail.questions_count}</strong></div>
                    <div>Total Marks: <strong className="text-zinc-800">{selectedExamDetail.total_marks}</strong></div>
                    <div>Negative Marking: <strong className="text-zinc-800">{selectedExamDetail.negative_marking ? `Yes (${selectedExamDetail.negative_marks} marks)` : "No"}</strong></div>
                    <div>Shuffle Questions: <strong className="text-zinc-800">{selectedExamDetail.shuffle_questions ? "Enabled" : "Disabled"}</strong></div>
                    <div>Shuffle Options: <strong className="text-zinc-800">{selectedExamDetail.shuffle_options ? "Enabled" : "Disabled"}</strong></div>
                    <div>Fullscreen Required: <strong className="text-zinc-800">{selectedExamDetail.fullscreen_required ? "Yes" : "No"}</strong></div>
                    <div>Auto Submit: <strong className="text-zinc-800">{selectedExamDetail.auto_submit ? "Yes" : "No"}</strong></div>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-500 font-semibold pt-1">
                    <div>Starts: <strong className="text-zinc-800">{selectedExamDetail.starts_at_label || selectedExamDetail.starts_at}</strong></div>
                    <div>Ends: <strong className="text-zinc-800">{selectedExamDetail.ends_at_label || selectedExamDetail.ends_at}</strong></div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs">Close</button>
              
              {selectedExamDetail && (
                <div>
                  {(selectedExamDetail.can_continue ?? (selectedExamDetail.attempt_status && selectedExamDetail.attempt_status !== "completed")) ? (
                    <button
                      onClick={() => handleStartExam(selectedExamDetail)}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FaFileAlt className="w-3.5 h-3.5" /> Continue Exam
                    </button>
                  ) : (selectedExamDetail.can_start ?? selectedExamDetail.status === "active") ? (
                    <button
                      onClick={() => handleStartExam(selectedExamDetail)}
                      className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FaFileAlt className="w-3.5 h-3.5" /> Start Exam
                    </button>
                  ) : (selectedExamDetail.can_view_result ?? selectedExamDetail.is_submitted) ? (
                    <button
                      onClick={() => handleViewResult(selectedExamDetail)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FaTrophy className="w-3.5 h-3.5" /> View Result
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {isResultModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up text-left flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
        <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
          <FaTrophy className="text-violet-500" /> Exam Result
        </h3>
        <button onClick={() => setIsResultModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {loadingResult ? (
          <div className="flex items-center justify-center py-10"><PageLoader /></div>
        ) : resultData ? (
          <>
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">Your Final Score</span>
              
              <span className="text-2xl font-black text-violet-900">
                {resultData.score ?? 0} / {resultData.total_marks ?? 0}
              </span>

              <span className="text-xs font-extrabold text-violet-700 block">
                Grade: {resultData.grade ?? "N/A"} ({resultData.percentage ?? 0}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-100 font-semibold text-zinc-600">
              <div>Total Questions: <strong className="text-zinc-800">{resultData.total_questions ?? "—"}</strong></div>
              <div>Attempt: <strong className="text-zinc-800 capitalize">{resultData.attempt_status ?? (resultData.is_submitted ? "Submitted" : "—")}</strong></div>
            </div>
          </>
        ) : null}
      </div>

      <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
        <button onClick={() => setIsResultModalOpen(false)} className="px-4 py-2 bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs">Close</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
