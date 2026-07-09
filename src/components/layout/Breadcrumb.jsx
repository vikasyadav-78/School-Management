"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChevronRight, FaHome } from "react-icons/fa";

export default function Breadcrumb() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "") return null;

  const paths = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs md:text-sm text-zinc-500 font-medium mb-6 py-2 px-1">
      <Link href="/" className="hover:text-violet-600 transition-colors flex items-center gap-1.5">
        <FaHome className="w-3.5 h-3.5 text-zinc-400" />
        <span>Dashboard</span>
      </Link>
      {paths.map((path, idx) => {
        const routeTo = `/${paths.slice(0, idx + 1).join("/")}`;
        const isLast = idx === paths.length - 1;

        // Skip dynamic IDs from showing raw in breadcrumb
        if (path.startsWith("[") || (path.match(/^[a-f0-9-]{36}$/i)) || (path.match(/^[0-9]+$/))) {
          return null;
        }

        const formattedName = path.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

        return (
          <div key={path} className="flex items-center space-x-2">
            <FaChevronRight className="w-2.5 h-2.5 text-zinc-300" />
            {isLast ? (
              <span className="text-violet-600 font-semibold">{formattedName}</span>
            ) : (
              <Link href={routeTo} className="hover:text-violet-600 transition-colors">
                {formattedName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
