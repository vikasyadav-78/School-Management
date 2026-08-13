"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FaArrowLeft } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import PageLoader from "@/components/common/PageLoader";
import { useAppDialog } from "@/context/DialogContext";

// Tabs component imports
import ExamManage from "@/features/exams/components/ExamManage";
import ExamDateSheet from "@/features/exams/components/ExamDateSheet";
import ExamAdmitCards from "@/features/exams/components/ExamAdmitCards";
import ExamResults from "@/features/exams/components/ExamResults";

import {
  fetchExamById,
  fetchExamsMeta,
  fetchExamAdmitCards,
  fetchExamResults,
  togglePublishExam,
  removeExam
} from "@/features/exams/redux/examThunk";

export default function ExamDetailPage() {
  const params = useParams();
  const { id } = params;
  const dispatch = useDispatch();
  const router = useRouter();
  const dialog = useAppDialog();

  const [activeTab, setActiveTab] = useState("manage"); // manage | date_sheet | admit_cards | results

  const {
    selectedItem,
    meta,
    schedules,
    admitCards,
    results,
    loading,
    error
  } = useSelector((state) => state.exams);

  // Load basic exam details & classes metadata on mount
  useEffect(() => {
    dispatch(fetchExamById(id));
    dispatch(fetchExamsMeta());
  }, [dispatch, id]);

  // Load tab specific details
  useEffect(() => {
    if (activeTab === "admit_cards") {
      dispatch(fetchExamAdmitCards({ examId: id }));
    } else if (activeTab === "results") {
      dispatch(fetchExamResults({ examId: id }));
    }
  }, [dispatch, id, activeTab]);

  const handleTogglePublish = async () => {
    const actionText = selectedItem?.is_published ? "unpublish" : "publish";
    const confirmed = await dialog.confirm({
      type: "warning",
      title: `${selectedItem?.is_published ? "Unpublish" : "Publish"} Exam`,
      message: `Are you sure you want to ${actionText} the exam "${selectedItem?.name}"?`
    });

    if (confirmed) {
      try {
        await dispatch(togglePublishExam(id)).unwrap();
        toast.success(`Exam ${actionText}ed successfully!`);
        dispatch(fetchExamById(id));
      } catch (err) {
        toast.error(err || `Failed to ${actionText} exam`);
      }
    }
  };

  const handleDelete = async () => {
    const confirmed = await dialog.confirm({
      type: "danger",
      title: "Delete Exam",
      message: `Are you sure you want to delete this exam "${selectedItem?.name}"? All associated schedules will be deleted.`
    });

    if (confirmed) {
      try {
        await dispatch(removeExam(id)).unwrap();
        toast.success("Exam deleted successfully.");
        router.push("/admin/exams");
      } catch (err) {
        toast.error(err || "Failed to delete exam");
      }
    }
  };

  const handleRefresh = () => {
    dispatch(fetchExamById(id));
  };

  if (loading && !selectedItem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <PageLoader />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedItem) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-zinc-400 font-medium text-xs">
          Exam not found. <Link href="/admin/exams" className="text-violet-600 hover:underline">Back to Directory</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={selectedItem.name}
        subtitle={`${selectedItem.type_label} | Start: ${selectedItem.start_date} | End: ${selectedItem.end_date}`}
        action={
          <Link href="/admin/exams">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      {/* Tabs Row */}
      <div className="flex flex-wrap border-b border-zinc-200 gap-2 mb-6">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
            activeTab === "manage"
              ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
          }`}
        >
          Manage
        </button>
        <button
          onClick={() => setActiveTab("date_sheet")}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
            activeTab === "date_sheet"
              ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
          }`}
        >
          Date Sheet
        </button>
        <button
          onClick={() => setActiveTab("admit_cards")}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
            activeTab === "admit_cards"
              ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
          }`}
        >
          Admit Cards
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer text-xs ${
            activeTab === "results"
              ? "border-violet-600 text-violet-600 bg-violet-50/50 rounded-t-xl font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-600 font-semibold"
          }`}
        >
          Results
        </button>
        <button
          onClick={() => router.push(`/admin/exams/${id}/reports`)}
          className="px-5 py-2.5 font-bold uppercase tracking-wider border-b-2 border-transparent text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer text-xs font-semibold"
        >
          Reports
        </button>

        <button
          onClick={handleTogglePublish}
          className={`px-5 py-2.5 font-bold uppercase tracking-wider transition-all cursor-pointer text-xs border border-transparent rounded-t-xl ml-auto ${
            selectedItem.is_published
              ? "text-amber-600 hover:bg-amber-50"
              : "text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          {selectedItem.is_published ? "Unpublish" : "Publish"}
        </button>
        <button
          onClick={handleDelete}
          className="px-5 py-2.5 font-bold uppercase tracking-wider transition-all cursor-pointer text-xs border border-transparent text-red-600 hover:bg-red-50 rounded-t-xl"
        >
          Delete
        </button>
      </div>

      {/* Tab Contents */}
      <div className="animate-fade-in">
        {activeTab === "manage" && (
          <ExamManage
            exam={selectedItem}
            classes={meta.classes || []}
            schedules={schedules}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === "date_sheet" && (
          <ExamDateSheet schedules={schedules} loading={loading} />
        )}

        {activeTab === "admit_cards" && (
          <ExamAdmitCards
            examId={id}
            students={admitCards.students}
            classes={meta.classes || []}
          />
        )}

        {activeTab === "results" && (
          <ExamResults rankings={results.rankings} classes={meta.classes || []} />
        )}
      </div>
    </DashboardLayout>
  );
}
