"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import Button from "@/components/ui/Button";

export default function TeacherForm({ onSubmit, initialData, isEdit = false }) {
  const methods = useForm({
    defaultValues: {
      id: "",
      name: "",
      email: "",
      mobile: "",
      department: "",
      gender: "",
      education: "",
      joiningDate: new Date().toISOString().slice(0, 10),
      status: "Active",
      address: ""
    }
  });

  const { reset } = methods;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 max-w-xl mx-auto text-black font-semibold bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          name="name"
          label="Full Name"
          placeholder="e.g. Alice Jenkins"
          validation={{ required: "Full name is required" }}
        />
        <FormInput
          name="email"
          label="Email Address"
          placeholder="e.g. alice@gmail.com"
          type="email"
          validation={{ required: "Email address is required" }}
        />
        <FormInput
          name="mobile"
          label="Mobile Number"
          placeholder="e.g. +91 9876543210"
          validation={{ required: "Mobile number is required" }}
        />
        <FormSelect
          name="gender"
          label="Gender"
          validation={{ required: "Gender is required" }}
          options={[
            { value: "", label: "Select Gender" },
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" }
          ]}
        />
        <FormSelect
          name="department"
          label="Subject Department"
          validation={{ required: "Subject department is required" }}
          options={[
            { value: "", label: "Select Department" },
            { value: "Hindi", label: "Hindi" }, 
            { value: "English", label: "English" },
            { value: "Mathematics", label: "Mathematics" },
            { value: "Sanskrit", label: "Sanskrit" },
            { value: "Science", label: "Science" },
            { value: "Social Science", label: "Social Science" },
            { value: "Physics", label: "Physics" },
            { value: "Chemistry", label: "Chemistry" },
            { value: "Biology", label: "Biology" },
            { value: "History", label: "History" },
            { value: "Geography", label: "Geography" }
          ]}
        />
        <FormSelect
          name="education"
          label="Education"
          validation={{ required: "Education is required" }}
          options={[
            { value: "", label: "Select Education" },
            { value: "B.Ed", label: "B.Ed (Bachelor of Education)" },
            { value: "M.Ed", label: "M.Ed (Master of Education)" },
            { value: "M.Sc", label: "M.Sc (Master of Science)" },
            { value: "M.A", label: "M.A (Master of Arts)" },
            { value: "B.Sc", label: "B.Sc (Bachelor of Science)" }
          ]}
        />
        <FormInput
          name="joiningDate"
          label="Joining Date"
          type="date"
          validation={{ required: "Joining date is required" }}
        />
        <FormSelect
          name="status"
          label="Status"
          options={[
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" }
          ]}
        />
        <FormInput
          name="profileImage"
          label="Profile Image"
          placeholder="profile img"
          type="file"


        />
        <div className="col-span-1 sm:col-span-2">
          <FormInput
            name="address"
            label="Residential Address"
            placeholder="e.g. 742 Evergreen Terrace, Springfield"
            validation={{ required: "Address is required" }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" size="md" className="bg-teacher-600 hover:bg-teacher-700 shadow-md shadow-teacher-600/10 focus:ring-teacher-500 border-none">
          {isEdit ? "Update Teacher Record" : "Add Teacher Entry"}
        </Button>
      </div>
    </FormWrapper>
  );
}
