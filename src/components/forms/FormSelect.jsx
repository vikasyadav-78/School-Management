"use client";

import { useFormContext } from "react-hook-form";
import Select from "../ui/Select";

export default function FormSelect({ name, validation = {}, ...props }) {
  const { register, formState: { errors } } = useFormContext();
  return (
    <Select
      {...props}
      {...register(name, validation)}
      error={errors[name]?.message}
    />
  );
}
