"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FaArrowLeft } from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import ExamForm from "@/features/exams/components/ExamForm";
import { fetchExamsMeta, createNewExam } from "@/features/exams/redux/examThunk";

export default function CreateExamPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { meta, loading } = useSelector((state) => state.exams);

  useEffect(() => {
    dispatch(fetchExamsMeta());
  }, [dispatch]);

  const handleCreateSubmit = async (data) => {
    try {
      await dispatch(createNewExam(data)).unwrap();
      toast.success("Exam created successfully!");
      router.push("/admin/exams");
    } catch (err) {
      toast.error(err || "Failed to create exam");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Create Exam"
        subtitle="Setup a new exam period and configuration."
        action={
          <Link href="/admin/exams">
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Directory
            </Button>
          </Link>
        }
      />

      <ExamForm onSubmit={handleCreateSubmit} meta={meta} />
    </DashboardLayout>
  );
}
