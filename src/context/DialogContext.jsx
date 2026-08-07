"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTrash } from "react-icons/fa";

const DialogContext = createContext(null);

export function useAppDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useAppDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }) {
  const [isRendered, setIsRendered] = useState(false);
  const [animClass, setAnimClass] = useState(""); // "", "dialog-open", "dialog-closing"
  const [options, setOptions] = useState({});
  const [resolver, setResolver] = useState(null);
  const [promptValue, setPromptValue] = useState("");
  
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);

  // Expose global methods
  const openConfirm = (opts = {}) => {
    return new Promise((resolve) => {
      setOptions({
        type: "warning",
        title: "Confirm Action",
        confirmText: "Confirm",
        cancelText: "Cancel",
        ...opts,
        isPrompt: false,
      });
      setPromptValue("");
      setResolver(() => resolve);
      
      // Start open transition sequence
      setIsRendered(true);
    });
  };

  const openAlert = (opts = {}) => {
    return new Promise((resolve) => {
      setOptions({
        type: "info",
        title: "Alert",
        confirmText: "OK",
        cancelText: null,
        ...opts,
        isPrompt: false,
      });
      setPromptValue("");
      setResolver(() => resolve);
      
      // Start open transition sequence
      setIsRendered(true);
    });
  };

  const openPrompt = (opts = {}) => {
    return new Promise((resolve) => {
      setOptions({
        type: "info",
        title: "Input Required",
        confirmText: "Submit",
        cancelText: "Cancel",
        placeholder: "Type here...",
        inputType: "text",
        ...opts,
        isPrompt: true,
      });
      setPromptValue(opts.defaultValue || "");
      setResolver(() => resolve);
      
      // Start open transition sequence
      setIsRendered(true);
    });
  };

  // Trigger animClass open state on mount
  useEffect(() => {
    if (isRendered) {
      const timer = setTimeout(() => {
        setAnimClass("dialog-open");
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isRendered]);

  const closeWithAnimation = (result) => {
    setAnimClass("dialog-closing");
    setTimeout(() => {
      setIsRendered(false);
      setAnimClass("");
      if (resolver) {
        resolver(result);
      }
    }, 250); // wait for exit transitions
  };

  const handleConfirm = () => {
    if (options.isPrompt) {
      closeWithAnimation(promptValue);
    } else {
      closeWithAnimation(true);
    }
  };

  const handleCancel = () => {
    closeWithAnimation(false);
  };

  // Close when clicking outside of the modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleCancel();
    }
  };

  // Keyboard navigation, ESC key, and Focus trapping
  useEffect(() => {
    if (!isRendered) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }

      // Focus trapping
      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Auto-focus first focusable input or button
    const timer = setTimeout(() => {
      const inputs = modalRef.current?.querySelectorAll("input, textarea");
      if (inputs && inputs.length > 0) {
        inputs[0].focus();
      } else if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isRendered, animClass, resolver, promptValue]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isRendered) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isRendered]);

  const renderIcon = () => {
    const type = options.type || "info";
    switch (type) {
      case "danger":
      case "delete":
        return (
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <FaTrash className="w-5 h-5" />
          </div>
        );
      case "success":
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <FaCheckCircle className="w-5 h-5" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 animate-pulse">
            <FaExclamationTriangle className="w-5 h-5" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <FaInfoCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <DialogContext.Provider value={{ confirm: openConfirm, alert: openAlert, prompt: openPrompt }}>
      {children}

      {/* Reusable premium animation custom dialog modal */}
      {isRendered && (
        <div 
          onClick={handleBackdropClick}
          className={`fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-950/45 dialog-backdrop ${animClass}`}
        >
          <div 
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden text-left flex flex-col dialog-modal ${animClass}`}
          >
            
            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              {renderIcon()}

              <div className="space-y-1">
                <h3 className="font-extrabold text-zinc-800 text-sm capitalize">{options.title}</h3>
                <p className="text-zinc-500 font-semibold text-xs leading-relaxed">{options.message}</p>
                {options.subtitle && (
                  <p className="text-zinc-400 font-medium text-[10px] mt-1">{options.subtitle}</p>
                )}
              </div>

              {/* Prompt input field */}
              {options.isPrompt && (
                <div className="w-full pt-1">
                  {options.inputType === "textarea" ? (
                    <textarea
                      rows={3}
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      placeholder={options.placeholder}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs resize-none focus:border-violet-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      placeholder={options.placeholder}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl outline-none text-black font-semibold text-xs focus:border-violet-500"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-150/60 flex items-center justify-end gap-2.5">
              {options.cancelText && (
                <button
                  type="button"
                  ref={cancelBtnRef}
                  onClick={handleCancel}
                  className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl text-xs transition-all cursor-pointer dialog-btn"
                >
                  {options.cancelText}
                </button>
              )}

              <button
                type="button"
                ref={confirmBtnRef}
                onClick={handleConfirm}
                className={`px-5 py-2 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm text-white dialog-btn ${
                  options.type === "danger" || options.type === "delete"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : options.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750"
                }`}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
