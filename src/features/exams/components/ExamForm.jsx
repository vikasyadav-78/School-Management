"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import Button from "@/components/ui/Button";

export default function ExamForm({ onSubmit, initialData, isEdit = false, meta = {} }) {
  const methods = useForm({
    defaultValues: {
      name: "",
      type: "",
      start_date: "",
      end_date: "",
      academic_year_id: "",
      exam_center: ""
    }
  });

  const { reset } = methods;

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        type: initialData.type || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        academic_year_id: initialData.academic_year_id || "",
        exam_center: initialData.exam_center || ""
      });
    }
  }, [initialData, reset]);

  const yearOptions = [
    { value: "", label: "Select Academic Year" },
    ...(meta.academic_years || []).map(y => ({ value: y.id, label: y.name }))
  ];

  const typeOptions = [
    { value: "", label: "Select Exam Type" },
    ...(meta.exam_types || []).map(t => ({ value: t.value, label: t.label }))
  ];

  return (
    <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 max-w-xl mx-auto text-black font-semibold bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
        <FormInput
          name="name"
          label="Exam Name"
          placeholder="e.g. Midterm Examination"
          validation={{ required: "Exam name is required" }}
        />
        <FormSelect
          name="type"
          label="Exam Type"
          validation={{ required: "Exam type is required" }}
          options={typeOptions}
        />
        <FormSelect
          name="academic_year_id"
          label="Academic Year"
          validation={{ required: "Academic year is required" }}
          options={yearOptions}
        />
        <FormInput
          name="exam_center"
          label="Exam Center"
          placeholder="e.g. Main Hall / school name"
        />
        <FormInput
          name="start_date"
          label="Start Date"
          type="date"
          validation={{ required: "Start date is required" }}
        />
        <FormInput
          name="end_date"
          label="End Date"
          type="date"
          validation={{ required: "End date is required" }}
        />
      </div>

      <div className="pt-2 flex justify-end gap-2">
        <Button type="submit" variant="primary" className="px-6 py-2.5">
          {isEdit ? "Update Exam" : "Create Exam"}
        </Button>
      </div>
    </FormWrapper>
  );
}
