"use client";

import { FormProvider } from "react-hook-form";

export default function FormWrapper({ children, methods, onSubmit, className = "", method = "POST" }) {
  return (
    <FormProvider {...methods}>
      <form noValidate method={method} onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
}
