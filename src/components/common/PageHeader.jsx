"use client";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-zinc-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-400 font-medium mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
