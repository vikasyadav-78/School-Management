"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormWrapper from "@/components/forms/FormWrapper";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import Button from "@/components/ui/Button";
import { FaUser, FaEnvelope, FaLock, FaCamera, FaTimes, FaFileAlt } from "react-icons/fa";

export default function StudentForm({ onSubmit, initialData, isEdit = false, meta = null, preselectedClassId = "", preselectedSectionId = "" }) {
    const methods = useForm({
        mode: "onChange",
        defaultValues: {
            id: "",
            first_name: "",
            last_name: "",
            gender: "",
            date_of_birth: new Date().toISOString().slice(0, 10),
            apaar_id: "",
            auto_generate_id: true,
            student_id: "",
            admissionNo: "",
            email: "",
            password: "",
            school_class_id: "",
            section_id: "",
            academic_year_id: "",
            roll_no: "",
            admission_date: new Date().toISOString().slice(0, 10),
            father_name: "",
            mother_name: "",
            phone: "",
            address: "",
            status: "Active",
            id_card_theme: "",
            profileImage: null,
            birth_certificate: null,
            aadhaar_card: null,
            transfer_certificate: null,
            stream: ""
        }
    });

    const { reset, watch, setValue, register, formState: { errors } } = methods;

    const autoGenerateId = watch("auto_generate_id");
    const schoolClassId = watch("school_class_id");
    const profileImageFile = watch("profileImage");
    const birthCertFile = watch("birth_certificate");
    const aadhaarCardFile = watch("aadhaar_card");
    const transferCertFile = watch("transfer_certificate");

    const selectedClassObj = (meta?.classes || []).find(c => String(c.id) === String(schoolClassId));
    const cleanName = selectedClassObj ? selectedClassObj.name.replace(/class\s*-?/i, '').trim() : "";
    const showStreamField = cleanName === "11" || cleanName === "12";

    const [photoPreview, setPhotoPreview] = useState("");

    // Update photo preview URL reactively
    useEffect(() => {
        if (profileImageFile && profileImageFile.length > 0) {
            const objectUrl = URL.createObjectURL(profileImageFile[0]);
            setPhotoPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (initialData?.photo) {
            setPhotoPreview(initialData.photo);
        } else {
            setPhotoPreview("");
        }
    }, [profileImageFile, initialData]);

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                first_name: initialData.first_name || "",
                last_name: initialData.last_name || "",
                gender: initialData.gender || "",
                date_of_birth: (initialData.date_of_birth || "").slice(0, 10),
                apaar_id: initialData.apaar_id || "",
                auto_generate_id: initialData.auto_generate_id ?? true,
                student_id: initialData.student_id || "",
                admissionNo: initialData.admission_no || initialData.admissionNo || "",
                email: initialData.email || "",
                password: "",
                school_class_id: initialData.school_class_id || "",
                section_id: initialData.section_id || "",
                academic_year_id: initialData.academic_year_id || "",
                roll_no: initialData.roll_no || "",
                admission_date: (initialData.admission_date || "").slice(0, 10),
                father_name: initialData.father_name || "",
                mother_name: initialData.mother_name || "",
                phone: initialData.guardian_phone || initialData.phone || "",
                address: initialData.address || "",
                status: initialData.is_active ? "Active" : "Inactive",
                id_card_theme: initialData.id_card_theme || "",
                stream: initialData.stream || ""
            });
        } else if (meta) {
            reset({
                ...methods.getValues(),
                school_class_id: preselectedClassId || methods.getValues().school_class_id || "",
                section_id: preselectedSectionId || methods.getValues().section_id || "",
                academic_year_id: meta.current_academic_year_id || "",
                admissionNo: meta.preview_ids?.admission_no || "",
                student_id: meta.preview_ids?.student_id || "",
                id_card_theme: meta.id_card_themes?.[0]?.key || ""
            });
        }
    }, [initialData, meta, reset, preselectedClassId, preselectedSectionId]);

    const handleFormSubmit = (data) => {
        // Build output payload mapping names back to FullName for components that require it
        const output = {
            ...data,
            name: [data.first_name, data.last_name].filter(Boolean).join(" "),
            parentName: data.father_name || data.mother_name || ""
        };
        onSubmit(output);
    };

    return (
        <FormWrapper methods={methods} onSubmit={handleFormSubmit} className="space-y-6 max-w-4xl mx-auto text-black font-semibold bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-xs text-left">
            
            {/* PERSONAL PROFILE */}
            <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Personal Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        name="first_name"
                        label="First Name *"
                        placeholder="e.g. Ramesh"
                        validation={{ required: "First name is required" }}
                    />
                    <FormInput
                        name="last_name"
                        label="Last Name"
                        placeholder="e.g. Kumar"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <FormSelect
                        name="gender"
                        label="Gender *"
                        validation={{ required: "Gender is required" }}
                        options={[
                            { value: "", label: "Select Gender" },
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" },
                            { value: "other", label: "Other" }
                        ]}
                    />
                    <FormInput
                        name="date_of_birth"
                        label="Date of Birth *"
                        type="date"
                        validation={{ required: "Date of birth is required" }}
                    />
                    <FormInput
                        name="apaar_id"
                        label="APAAR ID"
                        placeholder="e.g. 789456123652"
                    />
                </div>
            </div>

            {/* ID GENERATION OPTION */}
            {!isEdit && (
                <div className="space-y-3 pt-2 bg-zinc-50/50 p-4 rounded-xl border border-zinc-150">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="autoGenCheck"
                            {...register("auto_generate_id")}
                            className="w-4 h-4 rounded text-violet-600 border-zinc-300 focus:ring-violet-500 cursor-pointer"
                        />
                        <label htmlFor="autoGenCheck" className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wide cursor-pointer select-none">
                            Auto-generate Student ID and Admission Number
                        </label>
                    </div>

                    {!autoGenerateId && (
                        <div className="grid grid-cols-2 gap-4 pt-2 animate-scale-up">
                            <FormInput
                                name="student_id"
                                label="Manual Student ID *"
                                placeholder="e.g. STU-SCH-0001"
                                validation={{ required: !autoGenerateId ? "Manual Student ID is required" : false }}
                            />
                            <FormInput
                                name="admissionNo"
                                label="Manual Admission No *"
                                placeholder="e.g. ADM-SCH-2026-0001"
                                validation={{ required: !autoGenerateId ? "Manual Admission No is required" : false }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* OPTIONAL LOGIN ACCOUNT */}
            {!isEdit && (
                <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Optional Login Account</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            name="email"
                            label="Student Email"
                            placeholder="student@school.com"
                            type="email"
                            validation={{
                                pattern: {
                                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                    message: "Please enter a valid email address."
                                }
                            }}
                        />
                        <FormInput
                            name="password"
                            label="Student Password"
                            placeholder="••••••••"
                            type="password"
                        />
                    </div>
                </div>
            )}

            {/* CLASS ENROLLMENT */}
            <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Class Enrollment</h4>
                <div className={`grid gap-4 ${showStreamField ? "grid-cols-3" : "grid-cols-2"}`}>
                    <FormSelect
                        name="school_class_id"
                        label="School Class *"
                        validation={{ required: "Class selection is required" }}
                        options={[
                            { value: "", label: "Select Class" },
                            ...(meta?.classes || []).map(c => ({ value: String(c.id), label: c.name }))
                        ]}
                    />
                    <FormSelect
                        name="section_id"
                        label="Section *"
                        validation={{ required: "Section selection is required" }}
                        options={[
                            { value: "", label: "Select Section" },
                            ...((meta?.classes || []).find(c => String(c.id) === String(schoolClassId))?.sections || []).map(s => ({ value: String(s.id), label: s.name }))
                        ]}
                    />
                    {showStreamField && (
                        <FormSelect
                            name="stream"
                            label="Academic Stream *"
                            validation={{ required: showStreamField ? "Stream selection is required" : false }}
                            options={[
                                { value: "", label: "Select Stream" },
                                { value: "Science", label: "Science" },
                                { value: "Commerce", label: "Commerce" },
                                { value: "Arts", label: "Arts" }
                            ]}
                        />
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <FormSelect
                        name="academic_year_id"
                        label="Academic Year *"
                        validation={{ required: "Academic year is required" }}
                        options={[
                            { value: "", label: "Select Year" },
                            ...(meta?.academic_years || []).map(y => ({ value: String(y.id), label: `${y.name} ${y.is_current ? "(Current)" : ""}` }))
                        ]}
                    />
                    <FormInput
                        name="roll_no"
                        label="Roll No"
                        placeholder="e.g. 15"
                    />
                    <FormInput
                        name="admission_date"
                        label="Admission Date"
                        type="date"
                    />
                </div>
            </div>

            {/* PARENTS & CONTACT INFORMATION */}
            <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Parents & Contact Information</h4>
                <div className="grid grid-cols-3 gap-4">
                    <FormInput
                        name="father_name"
                        label="Father Name *"
                        placeholder="Father's Full Name"
                        validation={{ required: "Father name is required" }}
                    />
                    <FormInput
                        name="mother_name"
                        label="Mother Name"
                        placeholder="Mother's Full Name"
                    />
                    <FormInput
                        name="phone"
                        label="Guardian Phone *"
                        placeholder="10-digit number"
                        maxLength={10}
                        onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, "");
                            if (val.length > 0 && !/^[6-9]/.test(val)) {
                                val = "";
                            }
                            const capped = val.slice(0, 10);
                            e.target.value = capped;
                            setValue("phone", capped);
                        }}
                        validation={{
                            required: "Guardian phone is required",
                            pattern: {
                                value: /^[6-9]\d{9}$/,
                                message: "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9"
                            }
                        }}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Address Description</label>
                    <textarea
                        rows={2}
                        {...register("address")}
                        placeholder="Residential address..."
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold text-black resize-none"
                    />
                </div>
            </div>

            {/* PHOTO & STATUS */}
            <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Photo & Status</h4>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="relative group w-20 h-20 rounded-full bg-zinc-200 border border-zinc-300 overflow-hidden flex items-center justify-center shrink-0">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <FaCamera className="w-6 h-6 text-zinc-400" />
                        )}
                        <label className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            Upload
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    setValue("profileImage", e.target.files);
                                }}
                            />
                        </label>
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Attach ID Photo</span>
                        <p className="text-[9px] text-zinc-400 leading-normal">
                            PNG, JPG formats supported. Keep profile pictures clear (Max 2MB).
                        </p>
                    </div>

                    <div className="sm:ml-auto flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active Status</span>
                        <select
                            {...register("status")}
                            className="px-3 py-1.5 border border-zinc-200 rounded-xl bg-white outline-none text-xs font-bold text-zinc-700 cursor-pointer"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* DOCUMENTS & CERTIFICATES */}
            <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider pb-1 border-b border-zinc-100 block">Documents & Certificates (Max 5MB)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Birth Certificate */}
                    <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Birth Certificate</label>
                        <div className="flex flex-col gap-2">
                            <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                                <span>{birthCertFile?.[0]?.name ? "Change File" : "Choose File"}</span>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                        setValue("birth_certificate", e.target.files);
                                    }}
                                />
                            </label>
                            {birthCertFile?.[0]?.name ? (
                                <span className="text-[9px] text-zinc-400 truncate max-w-full font-semibold block text-center mt-1">
                                    {birthCertFile[0].name}
                                </span>
                            ) : (
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                            )}
                        </div>
                    </div>

                    {/* Aadhaar Card */}
                    <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Aadhaar Card</label>
                        <div className="flex flex-col gap-2">
                            <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                                <span>{aadhaarCardFile?.[0]?.name ? "Change File" : "Choose File"}</span>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                        setValue("aadhaar_card", e.target.files);
                                    }}
                                />
                            </label>
                            {aadhaarCardFile?.[0]?.name ? (
                                <span className="text-[9px] text-zinc-400 truncate max-w-full font-semibold block text-center mt-1">
                                    {aadhaarCardFile[0].name}
                                </span>
                            ) : (
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                            )}
                        </div>
                    </div>

                    {/* Transfer Certificate */}
                    <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Transfer Certificate</label>
                        <div className="flex flex-col gap-2">
                            <label className="px-3 py-2 border border-dashed border-zinc-300 hover:border-violet-500 bg-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold text-zinc-600 cursor-pointer">
                                <span>{transferCertFile?.[0]?.name ? "Change File" : "Choose File"}</span>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                        setValue("transfer_certificate", e.target.files);
                                    }}
                                />
                            </label>
                            {transferCertFile?.[0]?.name ? (
                                <span className="text-[9px] text-zinc-400 truncate max-w-full font-semibold block text-center mt-1">
                                    {transferCertFile[0].name}
                                </span>
                            ) : (
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center block mt-1">Not Uploaded</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Submit Action Button */}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" size="md">
                    {isEdit ? "Update Student Profile" : "Register Student"}
                </Button>
            </div>
        </FormWrapper>
    );
}
