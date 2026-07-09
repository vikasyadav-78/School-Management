"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaChalkboardTeacher, FaUserGraduate, FaBook, FaBuilding,
  FaUsers, FaCalendarTimes, FaMoneyBillWave, FaCalendarAlt,
  FaShoppingCart, FaFileAlt, FaUser, FaChevronDown, FaChevronRight,
  FaGraduationCap, FaLock, FaUmbrellaBeach
} from "react-icons/fa";
import { MdDashboard, MdEmail } from "react-icons/md";
import { useSelector } from "react-redux";
import { APP_CONFIG } from "@/constants/appConfig";
import { ADMIN_NAVIGATION_ITEMS, TEACHER_NAVIGATION_ITEMS, STUDENT_NAVIGATION_ITEMS } from "@/constants";

const iconMap = {
  MdDashboard,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBook,
  FaBuilding,
  FaUsers,
  FaCalendarTimes,
  FaMoneyBillWave,
  MdEmail,
  FaCalendarAlt,
  FaShoppingCart,
  FaFileAlt,
  FaUser,
  FaLock,
  FaUmbrellaBeach
};

import { useSidebar } from "@/context/SidebarContext";

const SidebarIcon = ({ name, className }) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return <FaUser className={className} />;
  return <IconComponent className={className} />;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, isMobileOpen, closeSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [logoError, setLogoError] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || "admin";

  let navItems = ADMIN_NAVIGATION_ITEMS;
  let panelLabel = "Admin Panel";
  
  if (userRole === "teacher") {
    navItems = TEACHER_NAVIGATION_ITEMS;
    panelLabel = "Teacher Panel";
  } else if (userRole === "student") {
    navItems = STUDENT_NAVIGATION_ITEMS;
    panelLabel = "Student Panel";
  }

  const toggleSubmenu = (title) => {
    setExpandedMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isRouteActive = (item) => {
    if (item.path === "/" && pathname === "/") return true;
    if (item.path !== "/" && pathname.startsWith(item.path)) return true;
    return false;
  };

  return (
    <aside className={`fixed top-0 left-0 h-full z-40 bg-zinc-900 text-zinc-300 transition-all duration-300 ease-in-out border-r border-zinc-800 lg:translate-x-0 ${isOpen ? "lg:w-[280px]" : "lg:w-[80px]"
      } ${isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]"}`} >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-zinc-800 overflow-hidden">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg select-none">
          {user?.school?.logo && !logoError ? (
            <img 
              src={user.school.logo} 
              alt="School Logo" 
              className="w-8 h-8 object-contain shrink-0" 
              onError={() => setLogoError(true)} 
            />
          ) : (
            <FaGraduationCap className="text-violet-500 w-8 h-8 shrink-0 animate-pulse" />
          )}
          {isOpen && (
            <span className="transition-opacity duration-300 whitespace-nowrap text-sm" title={user?.school?.name || APP_CONFIG.fullName}>
              <span className="font-extrabold truncate block max-w-[160px] text-zinc-100">
                {user?.school?.name ? (
                  user.school.name.length > 20 
                    ? user.school.name.slice(0, 20) + "..." 
                    : user.school.name
                ) : APP_CONFIG.shortName}
              </span>
              <span className="text-violet-500 text-[10px] block -mt-0.5 font-bold uppercase tracking-wider">{panelLabel}</span>
            </span>
          )}
        </Link>
        {isMobileOpen && (
          <button
            onClick={closeSidebar}
            className="lg:hidden text-zinc-400 hover:text-white shrink-0"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="p-4 space-y-2 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar overflow-x-hidden ">
        {navItems.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const active = isRouteActive(item);
          const expanded = expandedMenus[item.title] || active;
          const showSubmenu = expanded && isOpen;

          return (
            <div key={item.title} className="space-y-1">
              {hasSubmenu ? (<div>
                <button onClick={() => { !isOpen && setIsOpen(true); toggleSubmenu(item.title); }}
                  className={`transition-all duration-200 hover:bg-zinc-800 hover:text-white flex items-center text-sm font-medium ${isOpen
                    ? `w-full justify-between px-4 py-3 rounded-lg ${active ? "bg-violet-950/40 text-violet-400 font-semibold" : "text-zinc-300"
                    }`
                    : `w-12 h-12 justify-center rounded-xl mx-auto ${active ? "bg-violet-950/40 text-violet-400" : "text-zinc-400"
                    }`
                    }`}

                  title={item.title}

                >
                  <div className={`flex items-center ${isOpen ? "gap-3 w-full" : "justify-center"}`}>
                    <SidebarIcon name={item.icon} className={`w-5 h-5 shrink-0 ${active ? "text-violet-400" : "text-zinc-400"}`} />
                    {isOpen && <span className="transition-opacity duration-300 whitespace-nowrap">{item.title}</span>}
                  </div>
                  {isOpen && (expanded ? (<FaChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />) : (<FaChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />))}
                </button>

                {/* Submenu Items */}
                {showSubmenu && (
                  <div className="pl-11 mt-1 space-y-1 transition-all duration-300">
                    {item.submenu.map((sub) => {
                      const subActive = pathname === sub.path;
                      return (
                        <Link 
                          key={sub.title}
                          href={sub.path}
                          onClick={closeSidebar}
                          className={`block px-4 py-2 text-xs font-medium rounded-md transition-colors hover:text-white ${subActive
                            ? "text-violet-400 font-semibold border-l-2 border-violet-500 pl-3"
                            : "text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              ) : (
                <Link
                  href={item.path}
                  onClick={closeSidebar}
                  className={`transition-all duration-200 hover:bg-zinc-800 hover:text-white flex items-center text-sm font-medium ${isOpen
                    ? `w-full gap-3 px-4 py-3 rounded-lg ${active ? "bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/20" : "text-zinc-300"
                    }`
                    : `w-12 h-12 justify-center rounded-xl mx-auto ${active ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-zinc-400"
                    }`
                    }`}
                  title={item.title}
                >
                  <SidebarIcon name={item.icon} className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-zinc-400"}`} />
                  {isOpen && <span className="transition-opacity duration-300 whitespace-nowrap">{item.title}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
