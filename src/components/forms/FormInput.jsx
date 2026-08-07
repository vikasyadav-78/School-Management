"use client";

import { useFormContext } from "react-hook-form";
import Input from "../ui/Input";

export default function FormInput({ name, validation = {}, onChange, ...props }) {
  const { register, formState: { errors } } = useFormContext();
  const registered = register(name, validation);
  return (
    <Input
      {...props}
      {...registered}
      onChange={(e) => {
        registered.onChange(e);
        if (onChange) onChange(e);
      }}
      error={errors[name]?.message}
    />
  );
}
