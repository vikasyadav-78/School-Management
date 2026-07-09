"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import StudentForm from "@/features/students/components/StudentForm";
import { fetchStudentsById, updateStudentsItem } from "@/features/students/redux/studentThunk";

export default function EditStudentPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { selectedItem: student, loading } = useSelector((state) => state.students);

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentsById(id));
    }
  }, [dispatch, id]);

  const handleEditSubmit = (data) => {
    console.log("Updating student data:", data);
    dispatch(updateStudentsItem({ id, data })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        router.push(`/admin/students/profile/${id}`);
      }
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Student"
        subtitle={`Modify registry profile details for ${student?.name || id}`}
        action={
          <Link href={`/admin/students/profile/${id}`}>
            <Button variant="outline" size="sm">
              <FaArrowLeft className="mr-1.5" /> Back to Profile
            </Button>
          </Link>
        }
      />

      {loading ? (
        <PageLoader />
      ) : student ? (
        <StudentForm onSubmit={handleEditSubmit} initialData={student} isEdit={true} />
      ) : (
        <div className="text-center py-12 text-zinc-400">Student not found.</div>
      )}
    </DashboardLayout>
  );
}
