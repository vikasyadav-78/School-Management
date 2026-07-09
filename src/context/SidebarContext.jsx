"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  // Desktop Sidebar open/collapsed state (default expanded = true)
  const [isOpen, setIsOpen] = useState(true);
  
  // Mobile Sidebar slide-in drawer open/close state (default closed = false)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const closeSidebar = () => {
    setIsMobileOpen(false);
  };

  // Synchronize resize behaviors safely
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isMobileOpen,
        toggleSidebar,
        closeSidebar,
        setIsOpen,
        setIsMobileOpen
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
