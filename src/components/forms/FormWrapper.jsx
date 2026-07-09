"use client";

import { FormProvider } from "react-hook-form";

export default function FormWrapper({ children, methods, onSubmit, className = "" }) {
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </FormProvider>
  );
}
