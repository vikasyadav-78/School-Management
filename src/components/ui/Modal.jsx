"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlay = true
}) {
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
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm transition-opacity"
    >
      <div className={`w-full ${sizes[size]} bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300`}>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
