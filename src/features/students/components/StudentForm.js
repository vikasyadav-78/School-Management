"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import Button from "@/components/ui/Button";

export default function StudentForm({ onSubmit, initialData, isEdit = false }) {
    const methods = useForm({
        defaultValues: {
            id: "",
            name: "",
            className: "",
            stream: "",
            section: "A",
            parentName: "",
            gender: "",
            dob: new Date().toISOString(),
            admissionDate: new Date().toISOString().slice(0, 10),
            admissionNo: "",
            email: "",
            phone: "",
            status: "Active",
            address: "",
            profileImage: ""
        }
    });

    const { reset, watch, setValue } = methods;

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    // Watch className to conditionally show high school Streams select dropdown
    const classNameValue = watch("className");
    const isHighSchool = classNameValue === "11" || classNameValue === "12";

    // Reset stream value if class changes to non-high school grade
    useEffect(() => {
        if (!isHighSchool) {
            setValue("stream", "");
        }
    }, [isHighSchool, setValue]);

    return (
        <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 max-w-xl mx-auto text-black font-semibold bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <FormInput
                    name="name"
                    label="Full Name"
                    placeholder="e.g. Alice Jenkins"
                    validation={{ required: "Full name is required" }}
                />

                {/* Grade Class */}
                <FormSelect
                    name="className"
                    label="Class"
                    validation={{ required: "Class grade is required" }}
                    options={[
                        { value: "", label: "Select Class" },
                        { value: "1", label: "Class 1" },
                        { value: "2", label: "Class 2" },
                        { value: "3", label: "Class 3" },
                        { value: "4", label: "Class 4" },
                        { value: "5", label: "Class 5" },
                        { value: "6", label: "Class 6" },
                        { value: "7", label: "Class 7" },
                        { value: "8", label: "Class 8" },
                        { value: "9", label: "Class 9" },
                        { value: "10", label: "Class 10" },
                        { value: "11", label: "Class 11" },
                        { value: "12", label: "Class 12" }
                    ]}
                />

                {/* Stream - Only visible for Class 11 and 12 */}
                {isHighSchool && (
                    <FormSelect
                        name="stream"
                        label="Academic Stream"
                        validation={{ required: "Stream selection is required" }}
                        options={[
                            { value: "", label: "Select Stream" },
                            { value: "Science", label: "Science" },
                            { value: "Commerce", label: "Commerce" },
                            { value: "Arts", label: "Arts" }
                        ]}
                    />
                )}

                {/* Section */}
                <FormSelect
                    name="section"
                    label="Section"
                    validation={{ required: "Section is required" }}
                    options={[
                        { value: "", label: "Select Section" },
                        { value: "A", label: "Section A" },
                        { value: "B", label: "Section B" },
                        { value: "C", label: "Section C" },
                        { value: "D", label: "Section D" }
                    ]}
                />

                {/* Gender */}
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

                {/* Parent's Name */}
                <FormInput
                    name="parentName"
                    label="Parent's Name"
                    placeholder="e.g. John Doe"
                    validation={{ required: "Parent's name is required" }}
                />

                {/* Mobile Phone Number */}
                <FormInput
                    name="phone"
                    label="Mobile Number"
                    placeholder="e.g. +91 9876543210"
                    validation={{ required: "Mobile number is required" }}
                />

                {/* Email Address */}
                <FormInput
                    name="email"
                    label="Email Address"
                    placeholder="e.g. student@school.com"
                    type="email"
                    validation={{ required: "Email address is required" }}
                />

                {/* Date of Birth */}
                <FormInput
                    name="dob"
                    label="Date of Birth"
                    type="date"
                    validation={{ required: "Date of birth is required" }}
                />

                {/* Admission Date */}
                <FormInput
                    name="admissionDate"
                    label="Admission Date"
                    type="date"
                    validation={{ required: "Admission date is required" }}
                />

                {/* Admission No */}
                <FormInput
                    name="admissionNo"
                    label="Admission Number"
                    placeholder="e.g. ADM-2026-001"
                    validation={{ required: "Admission number is required" }}
                />

                {/* Status */}
                <FormSelect
                    name="status"
                    label="Status"
                    options={[
                        { value: "Active", label: "Active" },
                        { value: "Inactive", label: "Inactive" }
                    ]}
                />

                {/* Profile Image */}
                <FormInput
                    name="profileImage"
                    label="Profile Image"
                    placeholder="Profile image URL or file"
                    type="file"
                />

                {/* Residential Address */}
                <div className="col-span-1 sm:col-span-2">
                    <FormInput
                        name="address"
                        label="Residential Address"
                        placeholder="e.g. 742 Evergreen Terrace, Springfield"
                        validation={{ required: "Address is required" }}
                    />
                </div>
            </div>

            {/* Submit Action Button */}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" size="md">
                    {isEdit ? "Update Student Record" : "Add Student Entry"}
                </Button>
            </div>
        </FormWrapper>
    );
}
