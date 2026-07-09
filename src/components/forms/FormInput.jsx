"use client";

import { useFormContext } from "react-hook-form";
import Input from "../ui/Input";

export default function FormInput({ name, validation = {}, ...props }) {
  const { register, formState: { errors } } = useFormContext();
  return (
    <Input
      {...props}
      {...register(name, validation)}
      error={errors[name]?.message}
    />
  );
}
