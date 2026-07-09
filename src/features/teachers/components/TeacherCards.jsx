"use client";

import { useState, useRef, useEffect } from "react";
import { FaEllipsisH, FaUserCircle } from "react-icons/fa";

function TeacherCard({ teacher, onView, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const renderAvatar = () => {
    let img = teacher.profileImage;

    // Handle FileList (often bound by file inputs)
    if (img && typeof img === "object" && img.constructor && img.constructor.name === "FileList") {
      img = img[0];
    }

    // Handle File (generate local object URL for instant previewing)
    if (img instanceof File || (img && typeof img === "object" && img.name && img.size)) {
      try {
        const objectUrl = URL.createObjectURL(img);
        return (
          <img
            src={objectUrl}
            alt={teacher.name}
            className="w-full h-full object-cover rounded-full animate-fade-in"
          />
        );
      } catch (e) {
        return <FaUserCircle className="w-full h-full text-zinc-300" />;
      }
    }

    const hasImageString = img && typeof img === "string" && (
      img.includes("/") ||
      img.includes(".") ||
      img.length > 10
    );

    if (hasImageString) {
      return (
        <img
          src={img}
          alt={teacher.name}
          className="w-full h-full object-cover rounded-full animate-fade-in"
        />
      );
    }

    return <FaUserCircle className="w-full h-full text-zinc-300" />;
  };

  const formatEducation = (edu) => {
    if (!edu) return "B.Ed";
    if (edu.includes("B.Ed") || edu.includes("M.Ed")) return edu;
    return `${edu}, B.Ed`;
  };

  return (
    <div className="relative bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
      {/* Three-Dot Menu in Top-Right Corner */}
      <div className="absolute top-4 right-4" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full transition-colors cursor-pointer select-none"
          title="Actions"
        >
          <FaEllipsisH className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-10 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => {
                setMenuOpen(false);
                onView && onView(teacher);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-teacher-600 transition-colors cursor-pointer"
            >
              View Profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit && onEdit(teacher);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-amber-600 transition-colors cursor-pointer"
            >
              Edit Teacher
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete && onDelete(teacher);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete Teacher
            </button>
          </div>
        )}
      </div>

      {/* Center Top Section */}
      <div className="flex flex-col items-center">
        <div
          onClick={() => onView && onView(teacher)}
          className="w-24 h-24 rounded-full bg-teacher-50 flex items-center justify-center text-4xl shadow-inner select-none cursor-pointer transition-transform duration-200 hover:scale-110 overflow-hidden shrink-0 border border-zinc-100"
          title="View Profile"
        >
          {renderAvatar()}
        </div>

        <h3
          onClick={() => onView && onView(teacher)}
          className="font-bold text-zinc-800 hover:text-teacher-600 cursor-pointer transition-colors duration-200 text-base text-center mt-4 px-2 truncate w-full"
          title="View Profile"
        >
          {teacher.name}
        </h3>

        <span className="text-xs text-zinc-400 font-semibold block mt-1 text-center">
          {formatEducation(teacher.education)}
        </span>
      </div>

      {/* Information Section with Dividers and Left Labels / Right Values */}
      <div className="border-t border-b border-zinc-100 py-3 my-4 space-y-2.5 text-xs w-full">
        <div className="flex justify-between items-center py-0.5">
          <span className="text-zinc-400 font-bold shrink-0">Gender :</span>
          <span className="text-zinc-700 font-semibold">{teacher.gender || "N/A"}</span>
        </div>
        <div className="border-t border-zinc-100/50"></div>
        <div className="flex justify-between items-center py-0.5">
          <span className="text-zinc-400 font-bold shrink-0">Phone No :</span>
          <span className="text-zinc-700 font-semibold">{teacher.mobile || teacher.phone || "N/A"}</span>
        </div>
        <div className="border-t border-zinc-100/50"></div>
        <div className="flex justify-between items-center py-0.5">
          <span className="text-zinc-400 font-bold shrink-0">Email :</span>
          <span className="text-zinc-700 font-semibold truncate ml-4 max-w-[170px]" title={teacher.email}>
            {teacher.email || "N/A"}
          </span>
        </div>
        <div className="border-t border-zinc-100/50"></div>
        <div className="flex justify-between items-center py-0.5">
          <span className="text-zinc-400 font-bold shrink-0">Address :</span>
          <span className="text-zinc-700 font-semibold truncate ml-4 max-w-[170px]" title={teacher.address}>
            {teacher.address || "N/A"}
          </span>
        </div>
      </div>

      {/* Bottom View Profile Action */}
      <div className="pt-1 flex justify-center w-full">
        <button
          onClick={() => onView && onView(teacher)}
          className="px-6 py-2.5 text-xs font-bold text-teacher-600 bg-teacher-50 hover:bg-teacher-100 hover:text-teacher-700 rounded-xl transition-all duration-200 cursor-pointer select-none"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

export default function TeacherCards({ teachers = [], onView, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {teachers.map((teacher) => (
        <TeacherCard
          key={teacher.id}
          teacher={teacher}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
