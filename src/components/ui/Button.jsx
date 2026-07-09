"use client";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  onClick,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/10 focus:ring-violet-500",
    secondary: "bg-zinc-800 hover:bg-zinc-950 text-white shadow-md shadow-zinc-800/10 focus:ring-zinc-700",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "border border-zinc-300 hover:bg-zinc-50 text-zinc-700 focus:ring-zinc-500",
    ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:ring-zinc-400"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4.5 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? disabledStyles : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
