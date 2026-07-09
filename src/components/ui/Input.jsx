"use client";

import { forwardRef } from "react";

const Input = forwardRef(({ label, error, helperText, labelClassName = "", className = "", ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className={`block text-xs font-semibold text-zinc-700 ${labelClassName}`}>{label}</label>}
      <input
        ref={ref}
        className={`w-full px-4 py-2 border rounded-lg text-xs outline-none bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all ${
          error ? "border-red-500 bg-red-50/10" : "border-zinc-200"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
      {!error && helperText && <p className="text-[10px] text-zinc-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = "Input";
export default Input;
