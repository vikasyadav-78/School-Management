"use client";

export default function Loader({ size = "md", color = "violet" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  const colors = {
    violet: "border-violet-600 border-t-transparent",
    white: "border-white border-t-transparent",
    zinc: "border-zinc-800 border-t-transparent"
  };

  return (
    <div className="flex items-center justify-center py-4">
      <div
        className={`animate-spin rounded-full ${sizes[size]} ${colors[color]}`}
      />
    </div>
  );
}
