"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function Drawer({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/50 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
      />
      
      {/* Content Container */}
      <div className={`relative w-full ${sizes[size]} h-full bg-white shadow-2xl flex flex-col transition-all duration-300 animate-slide-in`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-800 text-sm md:text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
